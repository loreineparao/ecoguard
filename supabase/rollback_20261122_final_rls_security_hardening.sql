-- ============================================================================
-- ECOGUARD: ROLLBACK FOR FINAL RLS SECURITY HARDENING
-- File: supabase/rollback_20261122_final_rls_security_hardening.sql
-- (Placed outside supabase/migrations/ so it is never auto-applied by CLI tools)
--
-- Safely removes only newly introduced restrictive policies and the security helper function.
-- Restores all tables and storage buckets to their exact prior policy state.
-- PRESERVES public.is_admin(), all data, triggers, and all 12 foreign keys.
-- ============================================================================

BEGIN;

-- 1. Drop Storage Restrictive Policies
DROP POLICY IF EXISTS "restrict_inactive_private_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "restrict_inactive_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "restrict_inactive_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "restrict_inactive_storage_delete" ON storage.objects;

-- 2. Drop Database Table Restrictive Policies
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
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'restrict_active_account_' || t, t);
    END IF;
  END LOOP;
END $$;

-- 3. Drop Profile Restrictive Policies
DROP POLICY IF EXISTS "restrict_profiles_insert_safety" ON public.profiles;
DROP POLICY IF EXISTS "restrict_active_account_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "restrict_active_account_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "restrict_active_account_profiles_delete" ON public.profiles;

-- 4. Drop Security Helper Function (Preserves public.is_admin())
DROP FUNCTION IF EXISTS security.is_active_account();

-- Safely drop security schema ONLY if it contains no other objects (NON-CASCADE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'security'
  ) THEN
    DROP SCHEMA IF EXISTS security RESTRICT;
  END IF;
END $$;

COMMIT;
