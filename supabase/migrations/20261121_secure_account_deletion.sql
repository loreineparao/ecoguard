-- ============================================================================
-- ECOGUARD: ACCOUNT DEACTIVATION PRIVILEGES & RLS SECURITY HARDENING
-- Office: Municipal Environment & Natural Resources Office (MENR), Mabini
--
-- CANCELLATION NOTICE:
-- The previous foreign-key migration (CASCADE to SET NULL) is CANCELLED.
-- All 12 existing foreign-key relationships, deletion rules, table names,
-- column names, and primary keys are 100% PRESERVED to maintain exact alignment
-- with the capstone manuscript, ERD, and data dictionary.
--
-- DO NOT EXECUTE AUTOMATICALLY. PRESENTED FOR USER REVIEW ONLY.
--
-- Architecture:
-- 1. Account deactivation is executed securely server-side via Supabase Auth Admin API
--    (GoTrue ban_duration: '876000h' and app_metadata: { account_status: 'deactivated' }).
-- 2. Profile status is set to deletion_status = 'deactivated' and
--    deletion_requested_at = now() using existing columns.
-- 3. Sessions and refresh tokens are globally revoked.
-- 4. Protected routes, server actions, APIs, and Storage are guarded by middleware.
-- 5. All municipal complaints, evidence, locations, permits, and documents remain
--    100% preserved and accessible to authorized MENR administrators.
--
-- ============================================================================
-- PART 1: REQUIRED TABLE PRIVILEGES FOR ADMIN CLIENT (SERVICE_ROLE)
-- Resolves PostgreSQL error 42501: "permission denied for table profiles".
--
-- In PostgreSQL, table grants are checked before Row Level Security (RLS).
-- The server-side Admin Client connects as 'service_role' and requires
-- standard table permissions to read and update public.profiles.
-- Zero schema alterations: no tables, columns, or foreign keys are modified.
-- ============================================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.profiles TO postgres;

-- ============================================================================
-- PART 2: OPTIONAL RLS HARDENING (FOR REVIEW)
-- Prevents authenticated residents from tampering with or un-deactivating their own
-- deletion_status or modifying their assigned role via client-side API calls.
-- Administrative server actions (using SUPABASE_SERVICE_ROLE_KEY) bypass RLS automatically.
-- ============================================================================

/*
DO $$
BEGIN
  -- Drop open update policy if present
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

  -- Create hardened update policy: residents can only update their own profile
  -- and cannot alter their role or deactivation status
  CREATE POLICY "Residents can update own profile non_sensitive_fields"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id AND deletion_status IS DISTINCT FROM 'deactivated')
    WITH CHECK (
      auth.uid() = id AND
      role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) AND
      deletion_status = (SELECT p.deletion_status FROM public.profiles p WHERE p.id = auth.uid())
    );
END $$;
*/
