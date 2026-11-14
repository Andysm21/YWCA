/*
# Scheduled camp opening

A camp with status 'closed' is already invisible to guests (RLS policy
guest_select_public_camps) and rejects registrations. This adds an optional
`opens_at` so a hidden camp can open itself at a chosen moment, plus
open_due_camps() which flips every due camp to 'open'. The website calls it
whenever someone loads a camp page or registers, and the daily cron calls it too.

Run this once in the Supabase SQL editor.
*/

ALTER TABLE camps ADD COLUMN IF NOT EXISTS opens_at timestamptz;

CREATE OR REPLACE FUNCTION public.open_due_camps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE camps
     SET status = 'open', opens_at = NULL
   WHERE status = 'closed' AND opens_at IS NOT NULL AND opens_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.open_due_camps() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_due_camps() TO anon, authenticated, service_role;
