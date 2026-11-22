-- ============================================================================
-- ECOGUARD: READ-ONLY SYSTEM CATALOG INSPECTION QUERY
-- Office: Municipal Environment & Natural Resources Office (MENR), Mabini
--
-- Safe, 100% read-only inspection query for the Supabase SQL Editor.
-- Inspects all public database tables, RLS enablement, existing policies,
-- table grants, column privileges, authorization routines, and storage buckets.
-- ============================================================================

-- 1. Table RLS Enablement Status
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname IN ('public')
ORDER BY tablename;

-- 2. All Existing RLS Policies across public and storage schemas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- 3. Table Privilege Grants for Application Roles (authenticated, anon, service_role)
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- 4. Custom Public Authorization Routines and Functions
SELECT 
  routine_schema,
  routine_name,
  routine_type,
  security_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 5. Supabase Storage Buckets and Public Access Configurations
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY id;
