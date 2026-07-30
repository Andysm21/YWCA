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
