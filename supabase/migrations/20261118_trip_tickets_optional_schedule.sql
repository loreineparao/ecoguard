-- Migration: Make schedule_id optional in public.trip_tickets
-- Purpose: Allows MENR administrators to record direct / ad-hoc completed trip tickets without selecting a predefined collection schedule.
-- Safety: Preserves existing foreign key constraints when schedule_id IS NOT NULL, and does NOT alter or delete any existing records.

DO $$
BEGIN
  -- Alter schedule_id column in trip_tickets to drop NOT NULL constraint if it was set
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trip_tickets'
      AND column_name = 'schedule_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.trip_tickets ALTER COLUMN schedule_id DROP NOT NULL;
  END IF;
END $$;