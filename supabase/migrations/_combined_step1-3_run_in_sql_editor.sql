-- YWCA Camp: combined schema migration (files 000001-000012)
-- Paste this whole file into Supabase SQL Editor and run once.
-- Safe to run inside a single transaction.
BEGIN;

-- ===== 20260729000001_enums_and_helpers.sql =====
/*
# Enums and role-check helper functions

## Summary
Foundational types and SECURITY DEFINER helper functions used by every RLS
policy in later migrations. `users` has RLS that blocks direct reads for
non-super-admins, so policies elsewhere can't just `SELECT role FROM users`
inline — they call these helpers, which run with definer (postgres)
privileges and only ever return facts about the calling `auth.uid()`.

## New types
- `user_role`: admin | super_admin
- `season_type`: summer | winter
- `season_status`: draft | open | closed
- `camp_status`: coming_soon | open | closed
- `registration_status`: pending_payment | waitlisted | payment_submitted | confirmed | refunded
- `document_type`: certificate | payment_screenshot

## New functions
- `public.current_staff_role()` — role of the calling authenticated user from
  `users`, or null if not staff.
- `public.is_admin()` — true for admin or super_admin.
- `public.is_super_admin()` — true for super_admin only.
- `public.set_updated_at()` — generic trigger to stamp `updated_at`.
*/

CREATE TYPE user_role AS ENUM ('admin', 'super_admin');
CREATE TYPE season_type AS ENUM ('summer', 'winter');
CREATE TYPE season_status AS ENUM ('draft', 'open', 'closed');
CREATE TYPE camp_status AS ENUM ('coming_soon', 'open', 'closed');
CREATE TYPE registration_status AS ENUM ('pending_payment', 'waitlisted', 'payment_submitted', 'confirmed', 'refunded');
CREATE TYPE document_type AS ENUM ('certificate', 'payment_screenshot');

-- users table is created in the next migration; these functions are defined
-- here but only become callable once it exists (same migration set).
CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_staff_role() IN ('admin', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_staff_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===== 20260729000002_users_table.sql =====
/*
# Staff users table

## Summary
Admin/Super Admin accounts only — guests never get a row here. `id` matches
`auth.uid()` from Supabase Auth (row is created alongside the auth user).

## RLS (per schema doc)
Guest: none. Admin: none. Super Admin: full.

Note: staff still need to resolve their OWN role to pass `is_admin()` checks
elsewhere — that's handled by the SECURITY DEFINER `current_staff_role()`
from the previous migration, which bypasses this table's RLS safely (it only
ever returns facts about the calling `auth.uid()`, never arbitrary rows).
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_full_users" ON users;
CREATE POLICY "super_admin_full_users"
ON users FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ===== 20260729000003_seasons_table.sql =====
/*
# Seasons table

## Summary
One Summer and one Winter per year (unique on year+type). Status is
draft/open/closed — only Super Admin can change it (opening a season is a
deliberate act, not date-derived).

## RLS (per schema doc)
Guest: SELECT open ones only. Admin: SELECT only (all rows). Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  type season_type NOT NULL,
  status season_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, type)
);

CREATE TRIGGER seasons_set_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_select_open_seasons" ON seasons;
CREATE POLICY "guest_select_open_seasons"
ON seasons FOR SELECT
TO anon
USING (status = 'open');

DROP POLICY IF EXISTS "admin_select_seasons" ON seasons;
CREATE POLICY "admin_select_seasons"
ON seasons FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "super_admin_full_seasons" ON seasons;
CREATE POLICY "super_admin_full_seasons"
ON seasons FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ===== 20260729000004_camps_table.sql =====
/*
# Camps table

## Summary
Belongs to a season. `status` is stored (not a generated column) because the
schema doc notes it's "derived from capacity + season status, but
overridable" — application/Super Admin logic sets it, not a DB trigger.

## RLS (per schema doc)
Guest: SELECT public ones (not closed). Admin: SELECT only (all rows, no
UPDATE/INSERT). Super Admin: full incl. INSERT/UPDATE.
*/

CREATE TABLE IF NOT EXISTS camps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  age_min int NOT NULL,
  age_max int NOT NULL,
  price_egp numeric NOT NULL,
  capacity int NOT NULL DEFAULT 48,
  date_start date NOT NULL,
  date_end date NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_photo_url text,
  status camp_status NOT NULL DEFAULT 'coming_soon',
  drive_folder_id text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (age_min <= age_max),
  CHECK (date_start <= date_end),
  CHECK (capacity > 0)
);

CREATE INDEX IF NOT EXISTS idx_camps_season_id ON camps(season_id);
CREATE INDEX IF NOT EXISTS idx_camps_status ON camps(status);

CREATE TRIGGER camps_set_updated_at
  BEFORE UPDATE ON camps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE camps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_select_public_camps" ON camps;
CREATE POLICY "guest_select_public_camps"
ON camps FOR SELECT
TO anon
USING (status <> 'closed');

DROP POLICY IF EXISTS "admin_select_camps" ON camps;
CREATE POLICY "admin_select_camps"
ON camps FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "super_admin_full_camps" ON camps;
CREATE POLICY "super_admin_full_camps"
ON camps FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ===== 20260729000005_registration_number_counters.sql =====
/*
# Registration number counters

## Summary
One row per 2-digit year, incremented atomically by the
`generate_registration_number()` function (next migration) to produce
YC260001-style numbers with no collisions/gaps under concurrent inserts.

## RLS
Not readable/writable by anon, authenticated, admin, or super_admin directly
— per the schema doc this table only exists to back the atomic-increment
function, which runs SECURITY DEFINER and bypasses RLS. No policies are
created, so RLS defaults to deny-all for every role except the service key.
*/

CREATE TABLE IF NOT EXISTS registration_number_counters (
  year int PRIMARY KEY,
  last_number int NOT NULL DEFAULT 0
);

ALTER TABLE registration_number_counters ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: only the SECURITY DEFINER function and the
-- service-role key (which bypasses RLS entirely) touch this table.

-- ===== 20260729000006_registrations_table.sql =====
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

-- ===== 20260729000007_registration_documents_table.sql =====
/*
# Registration documents table

## Summary
Metadata for certificate + payment-screenshot uploads stored in Google
Drive (Drive integration itself is next phase — this just holds the
pointer columns per the schema doc).

## RLS (per schema doc)
Guest: INSERT own via server route only — no anon/authenticated policy here
either, same reasoning as `registrations` (server route uses the service
role key). Admin: SELECT only. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS registration_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  drive_file_id text NOT NULL,
  drive_file_url text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes int NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  CHECK (file_size_bytes > 0 AND file_size_bytes <= 10 * 1024 * 1024)
);

CREATE INDEX IF NOT EXISTS idx_registration_documents_registration_id ON registration_documents(registration_id);

ALTER TABLE registration_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_registration_documents" ON registration_documents;
CREATE POLICY "admin_select_registration_documents"
ON registration_documents FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "super_admin_full_registration_documents" ON registration_documents;
CREATE POLICY "super_admin_full_registration_documents"
ON registration_documents FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ===== 20260729000008_site_settings_table.sql =====
/*
# Site settings table

## Summary
Key-value store for rarely-changed global config (bank IBAN/beneficiary,
contact email/phone).

## RLS (per schema doc)
Guest: none. Admin: SELECT, UPDATE. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_site_settings" ON site_settings;
CREATE POLICY "admin_select_site_settings"
ON site_settings FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings"
ON site_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "super_admin_insert_delete_site_settings" ON site_settings;
CREATE POLICY "super_admin_insert_delete_site_settings"
ON site_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_delete_site_settings" ON site_settings;
CREATE POLICY "super_admin_delete_site_settings"
ON site_settings FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- ===== 20260729000009_news_posts_table.sql =====
/*
# News posts table

## RLS (per schema doc)
Guest: SELECT published only (published_at IS NOT NULL and not in the
future). Admin: full. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  cover_image_url text,
  published_at timestamptz,
  created_by uuid REFERENCES users(id)
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_select_published_news" ON news_posts;
CREATE POLICY "guest_select_published_news"
ON news_posts FOR SELECT
TO anon
USING (published_at IS NOT NULL AND published_at <= now());

DROP POLICY IF EXISTS "staff_full_news" ON news_posts;
CREATE POLICY "staff_full_news"
ON news_posts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ===== 20260729000010_gallery_images_table.sql =====
/*
# Gallery images table

## RLS (per schema doc)
Guest: SELECT published only — gallery has no draft/publish flag in the
schema doc, so all rows are treated as public (SELECT all for anon).
Admin: full. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id uuid REFERENCES camps(id) ON DELETE SET NULL,
  season_id uuid REFERENCES seasons(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  caption text,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_camp_id ON gallery_images(camp_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_season_id ON gallery_images(season_id);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_select_gallery_images" ON gallery_images;
CREATE POLICY "guest_select_gallery_images"
ON gallery_images FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "staff_full_gallery_images" ON gallery_images;
CREATE POLICY "staff_full_gallery_images"
ON gallery_images FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ===== 20260729000011_audit_log_table.sql =====
/*
# Audit log table

## Summary
Accountability trail for staff actions (confirm, refund, waitlist
promotion, camp edits, season changes). Rows are inserted by staff as they
act (actor_id must equal their own auth.uid()).

## RLS (per schema doc)
Guest: none. Admin: SELECT own actions. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_own_audit_log" ON audit_log;
CREATE POLICY "admin_select_own_audit_log"
ON audit_log FOR SELECT
TO authenticated
USING (public.is_admin() AND actor_id = auth.uid());

DROP POLICY IF EXISTS "staff_insert_own_audit_log" ON audit_log;
CREATE POLICY "staff_insert_own_audit_log"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND actor_id = auth.uid());

DROP POLICY IF EXISTS "super_admin_full_audit_log" ON audit_log;
CREATE POLICY "super_admin_full_audit_log"
ON audit_log FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ===== 20260729000012_registration_number_function.sql =====
/*
# Atomic registration number generator

## Summary
`generate_registration_number()` produces `YC` + 2-digit year + sequential
4-digit number (e.g. `YC260001`), using `registration_number_counters` as
the atomic source of truth. `INSERT ... ON CONFLICT ... RETURNING` under
Postgres's row-level locking makes concurrent calls safe — two simultaneous
registrations in the same year can never receive the same number.

SECURITY DEFINER so it can write to `registration_number_counters` even
though that table has no RLS policies granting direct access to anyone.
Intended to be called from the server-side registration API route (service
role or an authenticated/anon RPC call — RPC execution runs as the function
owner regardless of caller's row-level permissions on the counters table).
*/

CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  two_digit_year int := extract(year FROM now())::int % 100;
  next_number int;
BEGIN
  INSERT INTO registration_number_counters (year, last_number)
  VALUES (two_digit_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_number = registration_number_counters.last_number + 1
  RETURNING last_number INTO next_number;

  RETURN 'YC' || lpad(two_digit_year::text, 2, '0') || lpad(next_number::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_registration_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_registration_number() TO anon, authenticated, service_role;

COMMIT;
