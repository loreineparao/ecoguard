-- Migration: Permit Documents Metadata Table and Storage Bucket Policies
-- Safe, additive migration: ensures permit_documents table, storage bucket, and RLS policies exist.

-- 1. Create permit_documents metadata table if not exists
CREATE TABLE IF NOT EXISTS public.permit_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.permit_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by permit application
CREATE INDEX IF NOT EXISTS idx_permit_documents_app_id
  ON public.permit_documents(application_id, uploaded_at DESC);

-- Enable Row Level Security (RLS) on permit_documents
ALTER TABLE public.permit_documents ENABLE ROW LEVEL SECURITY;

-- Policies for permit_documents table
DO $$
BEGIN
  -- Residents can view their own permit document records
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'permit_documents' AND policyname = 'Residents can view own permit documents'
  ) THEN
    CREATE POLICY "Residents can view own permit documents"
      ON public.permit_documents
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Residents can insert their own permit document records
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'permit_documents' AND policyname = 'Residents can insert own permit documents'
  ) THEN
    CREATE POLICY "Residents can insert own permit documents"
      ON public.permit_documents
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- MENR Administrators can view all permit document records
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'permit_documents' AND policyname = 'Admins can view all permit documents'
  ) THEN
    CREATE POLICY "Admins can view all permit documents"
      ON public.permit_documents
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- 2. Ensure private storage bucket 'permit-documents' exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'permit-documents',
  'permit-documents',
  false,
  5242880, -- 5 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880;

-- 3. Storage RLS Policies for 'permit-documents' bucket
DO $$
BEGIN
  -- Authenticated users can upload to their own user folder: <user_id>/<application_id>/<filename>
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload own permit documents'
  ) THEN
    CREATE POLICY "Users can upload own permit documents"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'permit-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Authenticated residents can view/download their own documents, and MENR admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users and admins can read permit documents'
  ) THEN
    CREATE POLICY "Users and admins can read permit documents"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'permit-documents' AND
        (
          (storage.foldername(name))[1] = auth.uid()::text
          OR
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
          )
        )
      );
  END IF;
END $$;