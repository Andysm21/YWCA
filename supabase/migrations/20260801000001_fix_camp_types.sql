/*
# Fix camp_types RLS + missing seed row

## What's wrong (confirmed by direct query, not guessed)
- Service-role client sees all camp_types rows; anon-key client sees ZERO
  (RLS returns empty rather than erroring) — the SELECT policies from the
  original migration aren't actually in effect on this database, so the
  Super Admin Add Camp dropdown sees no camp types at all regardless of
  season, which shows as the misleading "all camp types already added"
  message.
- "Kids Camp" (winter) is missing from the seeded rows entirely, and the
  sort_order values on the rows that do exist don't match the original
  migration file — consistent with an earlier/partial version having been
  run at some point instead of the final one.

## Fix
Re-assert the RLS policies (idempotent — DROP IF EXISTS + CREATE, safe to
run even if they already exist correctly) and re-seed with ON CONFLICT DO
NOTHING (won't touch/duplicate any row that's already there correctly).
*/

ALTER TABLE camp_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_camp_types" ON camp_types;
CREATE POLICY "anon_select_camp_types"
ON camp_types FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "authenticated_select_camp_types" ON camp_types;
CREATE POLICY "authenticated_select_camp_types"
ON camp_types FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "super_admin_full_camp_types" ON camp_types;
CREATE POLICY "super_admin_full_camp_types"
ON camp_types FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

INSERT INTO camp_types (name, applicable_season_type, sort_order) VALUES
  ('Kids 1',          'summer', 10),
  ('Kids 2',          'summer', 20),
  ('Kids 3',          'summer', 30),
  ('Kids 4',          'summer', 40),
  ('Girls Camp',      'summer', 50),
  ('Boys Camp',       'summer', 60),
  ('Uni Camp',        'summer', 70),
  ('Kids Camp',       'winter', 10),
  ('Teen Camp',       'winter', 20),
  ('Leadership Camp', 'both',   90)
ON CONFLICT (name) DO NOTHING;
