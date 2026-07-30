/*
# Registrations table (replaces the earlier public-CRUD prototype)

## Summary
The earlier `registrations` table (20260728004439) was a flat prototype with
open anon CRUD and no relation to camps/seasons. This migration drops it and
recreates it per the locked-in schema doc: full camper/guardian fields, FK to
`camps`, the 5-state status machine, and staff audit columns
(confirmed_by/at, refunded_by/at/reason, promoted_from_waitlist_at).

This is pre-launch — no real registrations exist yet, so a destructive
replace is safe. Flagging it explicitly since DROP TABLE is irreversible.

## RLS (per schema doc)
Guest: INSERT own via server route only, no SELECT — all guest-facing writes
go through a Next.js API route using the service-role key (which bypasses
RLS), so no anon/authenticated policies are created here at all; this table
denies direct client access entirely except to staff.
Admin: SELECT all; UPDATE limited to status-transition fields only (enforced
by the `enforce_admin_registration_update` trigger below, since RLS itself
can't do column-level restriction) — no editing camper/guardian info.
Super Admin: full.
*/

DROP TABLE IF EXISTS registrations CASCADE;

CREATE TABLE registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE NOT NULL,
  camp_id uuid NOT NULL REFERENCES camps(id),
  status registration_status NOT NULL DEFAULT 'pending_payment',
  waitlist_position int,

  camper_name text NOT NULL,
  date_of_birth date NOT NULL,
  mobile_phone text NOT NULL,
  email text NOT NULL,
  school text NOT NULL,
  academic_year text NOT NULL,
  tshirt_size text NOT NULL,

  parent_name text NOT NULL,
  parent_mobile text NOT NULL,
  alternate_mobile text,
  parent_email text NOT NULL,

  first_time_camper boolean NOT NULL DEFAULT false,
  emergency_contact_name text NOT NULL,
  emergency_contact_number text NOT NULL,
  medical_condition text,
  additional_info text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  confirmed_by uuid REFERENCES users(id),
  confirmed_at timestamptz,
  refunded_by uuid REFERENCES users(id),
  refunded_at timestamptz,
  refund_reason text,
  promoted_from_waitlist_at timestamptz,

  CHECK (status <> 'waitlisted' OR waitlist_position IS NOT NULL)
);

CREATE INDEX idx_registrations_camp_id ON registrations(camp_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_waitlist_position ON registrations(waitlist_position) WHERE status = 'waitlisted';
CREATE INDEX idx_registrations_created_at ON registrations(created_at DESC);

CREATE TRIGGER registrations_set_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin can transition status/waitlist/audit fields only — camper/guardian
-- info and identity fields are read-only to them (Super Admin bypasses this).
CREATE OR REPLACE FUNCTION public.enforce_admin_registration_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_staff_role() = 'admin' THEN
    IF NEW.camp_id IS DISTINCT FROM OLD.camp_id
      OR NEW.registration_number IS DISTINCT FROM OLD.registration_number
      OR NEW.camper_name IS DISTINCT FROM OLD.camper_name
      OR NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth
      OR NEW.mobile_phone IS DISTINCT FROM OLD.mobile_phone
      OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.school IS DISTINCT FROM OLD.school
      OR NEW.academic_year IS DISTINCT FROM OLD.academic_year
      OR NEW.tshirt_size IS DISTINCT FROM OLD.tshirt_size
      OR NEW.parent_name IS DISTINCT FROM OLD.parent_name
      OR NEW.parent_mobile IS DISTINCT FROM OLD.parent_mobile
      OR NEW.alternate_mobile IS DISTINCT FROM OLD.alternate_mobile
      OR NEW.parent_email IS DISTINCT FROM OLD.parent_email
      OR NEW.first_time_camper IS DISTINCT FROM OLD.first_time_camper
      OR NEW.emergency_contact_name IS DISTINCT FROM OLD.emergency_contact_name
      OR NEW.emergency_contact_number IS DISTINCT FROM OLD.emergency_contact_number
      OR NEW.medical_condition IS DISTINCT FROM OLD.medical_condition
      OR NEW.additional_info IS DISTINCT FROM OLD.additional_info
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Admin may only update registration status/waitlist/audit fields, not camper or guardian info';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER registrations_enforce_admin_update
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_registration_update();

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_select_registrations" ON registrations;
CREATE POLICY "staff_select_registrations"
ON registrations FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "staff_update_registrations" ON registrations;
CREATE POLICY "staff_update_registrations"
ON registrations FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "super_admin_insert_delete_registrations" ON registrations;
CREATE POLICY "super_admin_insert_delete_registrations"
ON registrations FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_delete_registrations" ON registrations;
CREATE POLICY "super_admin_delete_registrations"
ON registrations FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- No anon policies: guest submissions go through the server-side API route
-- (service-role key), which bypasses RLS by design.
