-- Migration: Account Deletion Requests for EcoGuard (MENR Mabini)
-- Non-destructive, audit-compliant resident account deletion review pipeline
-- Preserves historical complaints, permits, and inspection logs under RA 9003 & PD 705

-- 1. Extend profiles table with deletion request tracking columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_status TEXT DEFAULT NULL;

-- 2. Create account_deletion_requests table
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT
);

-- Index for quick lookup by user and status
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id
  ON public.account_deletion_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status
  ON public.account_deletion_requests (status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$
BEGIN
  -- Authenticated residents can view their own deletion requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'account_deletion_requests' AND policyname = 'Residents can view own deletion requests'
  ) THEN
    CREATE POLICY "Residents can view own deletion requests"
      ON public.account_deletion_requests
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Authenticated residents can submit a deletion request for their own account
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'account_deletion_requests' AND policyname = 'Residents can submit own deletion request'
  ) THEN
    CREATE POLICY "Residents can submit own deletion request"
      ON public.account_deletion_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Authenticated residents can cancel their pending deletion request
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'account_deletion_requests' AND policyname = 'Residents can cancel own pending deletion request'
  ) THEN
    CREATE POLICY "Residents can cancel own pending deletion request"
      ON public.account_deletion_requests
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id AND status = 'pending')
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Administrators can view all deletion requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'account_deletion_requests' AND policyname = 'Admins can view all deletion requests'
  ) THEN
    CREATE POLICY "Admins can view all deletion requests"
      ON public.account_deletion_requests
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
