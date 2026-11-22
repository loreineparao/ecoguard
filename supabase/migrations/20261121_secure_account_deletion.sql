-- Migration: Secure Self-Service Account Deletion & Government Records Retention
-- Office: Municipal Environment & Natural Resources Office (MENR), Municipality of Mabini, Batangas
-- Legal Compliance: Republic Act No. 9003 (Solid Waste Management), Presidential Decree No. 705 (Forestry Code), RA 10173 (Data Privacy Act)

-- 1. Ensure public.complaints preserves municipal public records when a user account is deleted
--    Makes complaints.user_id nullable so records are preserved and unlinked/anonymized rather than cascade-deleted.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.complaints ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- 2. Ensure public.permit_applications preserves forestry permit records when a user account is deleted
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'permit_applications' AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.permit_applications ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- 3. Adjust Foreign Key on complaints(user_id) if it was set to ON DELETE CASCADE or RESTRICT
--    Ensures deleting auth.users either sets complaints.user_id to NULL or does not block deletion.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name, tc.table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'complaints'
      AND kcu.column_name = 'user_id'
  ) LOOP
    EXECUTE 'ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    EXECUTE 'ALTER TABLE public.complaints ADD CONSTRAINT ' || quote_ident(r.constraint_name) || ' FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL';
  END LOOP;
END $$;

-- 4. Adjust Foreign Key on permit_applications(user_id) to ON DELETE SET NULL
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name, tc.table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'permit_applications'
      AND kcu.column_name = 'user_id'
  ) LOOP
    EXECUTE 'ALTER TABLE public.permit_applications DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    EXECUTE 'ALTER TABLE public.permit_applications ADD CONSTRAINT ' || quote_ident(r.constraint_name) || ' FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL';
  END LOOP;
END $$;

-- 5. Create secure PostgreSQL RPC function: delete_own_account()
--    Allows authenticated resident to securely delete their own account and personal data
--    while preserving public municipal audit logs under RA 9003 & PD 705.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  -- Security Check 1: Must be authenticated
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Security Check 2: Prevent administrators from deleting accounts via resident self-service
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role = 'admin' THEN
    RAISE EXCEPTION 'Administrator accounts cannot be self-deleted. Contact Municipal HR / IT.';
  END IF;

  -- 1. Unlink/anonymize user_id in complaints to preserve municipal records
  UPDATE public.complaints
  SET user_id = NULL
  WHERE user_id = v_uid;

  -- 2. Unlink/anonymize user_id in permit_applications to preserve official permits
  UPDATE public.permit_applications
  SET user_id = NULL
  WHERE user_id = v_uid;

  -- 3. Delete AI chatbot conversations and messages (cascade deletes messages)
  DELETE FROM public.chat_conversations
  WHERE user_id = v_uid;

  -- 4. Delete account deletion requests
  DELETE FROM public.account_deletion_requests
  WHERE user_id = v_uid;

  -- 5. Delete resident profile row
  DELETE FROM public.profiles
  WHERE id = v_uid;

  -- 6. Permanently delete the user account from auth.users
  DELETE FROM auth.users
  WHERE id = v_uid;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Account and personal data successfully deleted. Official municipal records preserved under RA 9003.'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
