/*
# Per-camp birth-date range + bus pickup

## camps.dob_min / camps.dob_max (nullable)
Earliest / latest allowed date of birth for a camp. When set, the public
registration form's birth-date picker disables dates outside the range and the
server rejects registrations outside it. Null = no limit.

## registrations.bus_pickup (nullable text)
Meeting point chosen at registration (Mohandessin or Tagamo3). Nullable so
existing registrations stay valid.
*/

ALTER TABLE camps ADD COLUMN IF NOT EXISTS dob_min date;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS dob_max date;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'camps_dob_range_check') THEN
    ALTER TABLE camps ADD CONSTRAINT camps_dob_range_check CHECK (dob_min IS NULL OR dob_max IS NULL OR dob_min <= dob_max);
  END IF;
END $$;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS bus_pickup text;
