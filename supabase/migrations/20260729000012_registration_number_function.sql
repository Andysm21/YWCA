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
