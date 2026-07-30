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
