-- ============================================================================
-- ECOGUARD: FINAL RLS SECURITY HARDENING & ACTIVE-ACCOUNT ENFORCEMENT
-- Office: Municipal Environment & Natural Resources Office (MENR), Mabini
--
-- STRICT PRESERVATION GUARANTEES:
-- - Zero new tables.
-- - Zero new columns.
-- - Zero deleted tables or columns.
-- - All 12 foreign-key relationships and deletion rules are 100% PRESERVED.
-- - All primary keys are 100% PRESERVED.
-- - Existing public.is_admin() zero-argument function is 100% PRESERVED.
-- - Existing permissive ownership and administrator policies are 100% PRESERVED.
-- - Existing effective profile table privileges (SELECT: true, INSERT: false, UPDATE: false) PRESERVED.
-- - Existing on_auth_user_created trigger and handle_new_user() PRESERVED.
-- - No physical deletion of resident accounts or municipal records.
-- - Capstone manuscript, ERD, and data dictionary remain 100% intact.
--
-- ARCHITECTURE & SECURITY DESIGN:
-- 1. Uniquely Named Zero-Argument Helper in Dedicated Schema:
--    security.is_active_account() is placed in a non-exposed schema 'security'
--    with SET search_path = '', fully qualified references, and SECURITY DEFINER.
--    Bypasses RLS internally during evaluation to prevent infinite recursion.
-- 2. Fail-Closed Active Account Verification:
--    Derives identity exclusively from auth.uid(). Requires an existing profile and Auth account.
--    Validates:
--      - p.id = auth.uid()
--      - p.deletion_status IS NULL
--      - p.role IN ('resident', 'admin')
--      - u.banned_until IS NULL OR u.banned_until <= pg_catalog.transaction_timestamp()
--      - u.raw_app_meta_data IS NULL OR (u.raw_app_meta_data->>'account_status') IS NULL OR (u.raw_app_meta_data->>'account_status') != 'deactivated'
--    Fails closed on missing profiles, deactivated status, bans, or unknown roles.
-- 3. PostgreSQL Restrictive Policies (AS RESTRICTIVE):
--    Uses solely security.is_active_account() as the restrictive condition.
--    Enforces logical AND across all public tables and private storage objects:
--      (Existing Permissive Ownership OR Admin Policies) AND (Restrictive Policy)
--    Overlapping permissive policies CANNOT bypass this check.
-- 4. Safe Profile Provisioning Defense in Depth:
--    Protects profile INSERT without breaking automatic registration by enforcing
--    auth.uid() = id, role = 'resident', deletion_status IS NULL.
-- 5. Storage Security:
--    Blocks deactivated accounts from reading, downloading, uploading, modifying,
--    deleting, or generating signed URLs for 'complaint-evidence' and 'permit-documents'.
--    Preserves public avatar read access while restricting avatar writes to active accounts.
--    Administrator access uses security.is_active_account() (which evaluates to TRUE for active admins)
--    independent of the document uploader's account status.
--
-- DO NOT EXECUTE AUTOMATICALLY. PRESENTED FOR ADMINISTRATIVE REVIEW.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: PREREQUISITE VALIDATION (ABORT IF EXPECTED TABLES ARE MISSING)
-- ============================================================================

DO $$
DECLARE
  missing_tables TEXT[];
  expected_tables TEXT[] := ARRAY[
    'profiles',
    'complaints',
    'evidence',
    'locations',
    'permit_applications',
    'permit_documents',
    'account_deletion_requests',
    'collection_schedules',
    'trip_tickets',
    'reports',
    'chatbot_logs'
  ];
BEGIN
  SELECT array_agg(t) INTO missing_tables
  FROM unnest(expected_tables) t
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables
    WHERE schemaname = 'public' AND tablename = t
  );

  IF missing_tables IS NOT NULL AND array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Database prerequisite check failed: Missing required table(s): %',
      array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- ============================================================================
-- STEP 2: NON-EXPOSED SECURITY SCHEMA & ZERO-ARGUMENT HELPER FUNCTION
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS security;
REVOKE ALL ON SCHEMA security FROM PUBLIC;
REVOKE ALL ON SCHEMA security FROM anon;
GRANT USAGE ON SCHEMA security TO authenticated, service_role;

-- Fail-closed active account verification helper
CREATE OR REPLACE FUNCTION security.is_active_account()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = auth.uid()
      AND p.deletion_status IS NULL
      AND p.role IN ('resident', 'admin')
      AND (u.banned_until IS NULL OR u.banned_until <= pg_catalog.transaction_timestamp())
      AND (
        u.raw_app_meta_data IS NULL
        OR (u.raw_app_meta_data->>'account_status') IS NULL
        OR (u.raw_app_meta_data->>'account_status') != 'deactivated'
      )
  );
$$;

REVOKE ALL ON FUNCTION security.is_active_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION security.is_active_account() FROM anon;
GRANT EXECUTE ON FUNCTION security.is_active_account() TO authenticated, service_role;

COMMENT ON FUNCTION security.is_active_account() IS
  'Secure, non-recursive, fail-closed verification of requesting user active status against both public.profiles and auth.users. Zero arguments.';

-- ============================================================================
-- STEP 3: RESTRICTIVE POLICIES ON PUBLIC.PROFILES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Restrictive policy on profile INSERT (Defense-in-depth: registration trigger runs as definer and bypasses RLS)
DROP POLICY IF EXISTS "restrict_profiles_insert_safety" ON public.profiles;
CREATE POLICY "restrict_profiles_insert_safety"
  ON public.profiles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role = 'resident'
    AND deletion_status IS NULL
    AND deletion_requested_at IS NULL
  );

-- Restrictive policy on profile SELECT
DROP POLICY IF EXISTS "restrict_active_account_profiles_select" ON public.profiles;
CREATE POLICY "restrict_active_account_profiles_select"
  ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (security.is_active_account());

-- Restrictive policy on profile UPDATE
DROP POLICY IF EXISTS "restrict_active_account_profiles_update" ON public.profiles;
CREATE POLICY "restrict_active_account_profiles_update"
  ON public.profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (security.is_active_account())
  WITH CHECK (security.is_active_account());

-- Restrictive policy on profile DELETE
DROP POLICY IF EXISTS "restrict_active_account_profiles_delete" ON public.profiles;
CREATE POLICY "restrict_active_account_profiles_delete"
  ON public.profiles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (security.is_active_account());

-- ============================================================================
-- STEP 4: RESTRICTIVE POLICIES ON REMAINING 10 APPLICATION TABLES
-- ============================================================================

DO $$
DECLARE
  t TEXT;
  target_tables TEXT[] := ARRAY[
    'complaints',
    'evidence',
    'locations',
    'permit_applications',
    'permit_documents',
    'account_deletion_requests',
    'collection_schedules',
    'trip_tickets',
    'reports',
    'chatbot_logs'
  ];
BEGIN
  FOREACH t IN ARRAY target_tables LOOP
    -- Ensure RLS is enabled
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    -- Drop existing restrictive policy if present
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'restrict_active_account_' || t, t);

    -- Create restrictive policy covering ALL operations (SELECT, INSERT, UPDATE, DELETE)
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated ' ||
      'USING (security.is_active_account()) ' ||
      'WITH CHECK (security.is_active_account());',
      'restrict_active_account_' || t,
      t
    );
  END LOOP;
END $$;

-- ============================================================================
-- STEP 5: RESTRICTIVE POLICIES ON SUPABASE STORAGE (storage.objects)
-- ============================================================================

-- 1. Restrict private file reads & signed URL creation (complaint-evidence, permit-documents)
--    Public avatars remain readable by all.
DROP POLICY IF EXISTS "restrict_inactive_private_storage_select" ON storage.objects;
CREATE POLICY "restrict_inactive_private_storage_select"
  ON storage.objects
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    bucket_id NOT IN ('complaint-evidence', 'permit-documents')
    OR security.is_active_account()
  );

-- 2. Restrict all storage file uploads across all buckets for deactivated users
DROP POLICY IF EXISTS "restrict_inactive_storage_insert" ON storage.objects;
CREATE POLICY "restrict_inactive_storage_insert"
  ON storage.objects
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (security.is_active_account());

-- 3. Restrict storage modifications across all buckets for deactivated users
DROP POLICY IF EXISTS "restrict_inactive_storage_update" ON storage.objects;
CREATE POLICY "restrict_inactive_storage_update"
  ON storage.objects
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (security.is_active_account())
  WITH CHECK (security.is_active_account());

-- 4. Restrict storage deletions across all buckets for deactivated users
DROP POLICY IF EXISTS "restrict_inactive_storage_delete" ON storage.objects;
CREATE POLICY "restrict_inactive_storage_delete"
  ON storage.objects
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (security.is_active_account());

COMMIT;
