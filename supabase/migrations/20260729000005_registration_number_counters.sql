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
