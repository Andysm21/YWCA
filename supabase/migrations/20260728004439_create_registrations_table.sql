/*
# Create registrations table for YWCA Camp

## Summary
This table stores camp registration submissions from the 2-step registration flow.
Since the app has no sign-in screen (guests register freely), this is a
single-tenant schema with public read/write access for anon + authenticated.

## New Tables
- `registrations`
  - `id` (uuid, primary key)
  - `camp_slug` (text, not null) — references camp by slug
  - `camp_name` (text, not null) — denormalized camp name for display
  - `season` (text, not null) — e.g. "Summer 2026"
  - `camper_name` (text, not null)
  - `age` (integer, not null)
  - `gender` (text, not null)
  - `guardian_name` (text, not null)
  - `email` (text, not null)
  - `phone` (text, not null)
  - `notes` (text, nullable) — medical/allergy notes
  - `price` (integer, not null) — camp price at time of registration (EGP)
  - `status` (text, not null, default 'pending') — pending | confirmed | waitlist
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled on `registrations`.
- Public CRUD for anon + authenticated (guests submit registrations without login).
- This is intentional: the registration form is public and does not require auth.
*/

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_slug text NOT NULL,
  camp_name text NOT NULL,
  season text NOT NULL,
  camper_name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  guardian_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  notes text,
  price integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registrations_camp_slug ON registrations(camp_slug);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_registrations" ON registrations;
CREATE POLICY "anon_select_registrations"
ON registrations FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_registrations" ON registrations;
CREATE POLICY "anon_insert_registrations"
ON registrations FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_registrations" ON registrations;
CREATE POLICY "anon_update_registrations"
ON registrations FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_registrations" ON registrations;
CREATE POLICY "anon_delete_registrations"
ON registrations FOR DELETE
TO anon, authenticated USING (true);
