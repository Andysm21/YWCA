-- Fixed camp-type catalog migration. Paste into Supabase SQL Editor and run once.
BEGIN;

/*
# Fixed camp-type catalog

## Summary
Replaces free-text camp naming with a fixed catalog Super Admin picks from,
preventing naming drift across years (e.g. "Kids Camp 1" vs "Kids 1" vs
"Kids1"). `camps.name` (free text) is dropped entirely — camp names are now
always resolved via the `camp_type_id` FK join, never stored redundantly.

## New table: camp_types
Read by everyone (needed for the public site to display camp names via the
join, and for the Add Camp dropdown); only Super Admin can manage the list.

## camps table changes
- `camp_type_id` added, backfilled from the old `name` column, then made
  NOT NULL.
- `name` column dropped — camp names are now ALWAYS read via
  `camp_type_id` -> `camp_types.name`, never stored redundantly on `camps`.
- UNIQUE (season_id, camp_type_id) — the same camp type can't be added
  twice to one season (e.g. two "Kids 1" rows in Summer 2026).

## Backfill safety
The old free-text names don't match the new fixed catalog names 1:1 (e.g.
legacy "Kids Camp 1" vs new "Kids 1"). The backfill below tries an exact
match first, then a small alias map for the known legacy naming
convention. If any row still can't be confidently mapped, the migration
RAISES EXCEPTION and stops — nothing is silently dropped or guessed at;
whoever runs this gets a list of the unmapped camp ids/names to fix by
hand (re-run after fixing) rather than corrupting registration-linked data.
*/

CREATE TYPE camp_type_season AS ENUM ('summer', 'winter', 'both');

CREATE TABLE IF NOT EXISTS camp_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  applicable_season_type camp_type_season NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

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

-- Seed: 7 summer-only + 2 winter-only + 1 shared (Leadership Camp = 'both',
-- a single row — NOT duplicated across summer and winter).
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

-- === camps table: add camp_type_id, backfill, drop name ===

ALTER TABLE camps ADD COLUMN IF NOT EXISTS camp_type_id uuid REFERENCES camp_types(id);

-- Pass 1: exact name match.
UPDATE camps
SET camp_type_id = camp_types.id
FROM camp_types
WHERE camps.camp_type_id IS NULL
  AND camps.name = camp_types.name;

-- Pass 2: known legacy naming aliases (pre-catalog free-text convention).
UPDATE camps
SET camp_type_id = camp_types.id
FROM camp_types
WHERE camps.camp_type_id IS NULL
  AND camp_types.name = CASE camps.name
    WHEN 'Kids Camp 1' THEN 'Kids 1'
    WHEN 'Kids Camp 2' THEN 'Kids 2'
    WHEN 'Kids Camp 3' THEN 'Kids 3'
    WHEN 'Kids Camp 4' THEN 'Kids 4'
    WHEN 'Girls Camp' THEN 'Girls Camp'
    WHEN 'Boys Camp' THEN 'Boys Camp'
    WHEN 'Uni Camp' THEN 'Uni Camp'
    WHEN 'Leadership Camp' THEN 'Leadership Camp'
    WHEN 'Kids Camp' THEN 'Kids Camp'
    WHEN 'Teen Camp' THEN 'Teen Camp'
    ELSE NULL
  END;

-- Refuse to proceed if anything is still unmapped — better a stopped
-- migration than silently orphaned/mis-typed camps.
DO $$
DECLARE
  unmapped record;
  unmapped_count int;
BEGIN
  SELECT count(*) INTO unmapped_count FROM camps WHERE camp_type_id IS NULL;
  IF unmapped_count > 0 THEN
    RAISE NOTICE 'Unmapped camps (id, name):';
    FOR unmapped IN SELECT id, name FROM camps WHERE camp_type_id IS NULL LOOP
      RAISE NOTICE '  % — %', unmapped.id, unmapped.name;
    END LOOP;
    RAISE EXCEPTION '% camp(s) could not be mapped to a camp_type — add an alias above or fix the row manually, then re-run this migration', unmapped_count;
  END IF;
END $$;

ALTER TABLE camps ALTER COLUMN camp_type_id SET NOT NULL;
ALTER TABLE camps DROP COLUMN name;
ALTER TABLE camps ADD CONSTRAINT camps_season_camp_type_unique UNIQUE (season_id, camp_type_id);

COMMIT;
