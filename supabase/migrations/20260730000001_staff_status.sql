/*
# Staff invite status (pending / active)

## Summary
Lets the Super Admin Staff tab distinguish invited-but-not-yet-accepted
accounts from ones that have actually signed in. `invite-admin` inserts new
rows as 'pending'; a self-service RPC flips a row to 'active' the first time
that person successfully logs in.

## Why an RPC, not a client-side UPDATE
RLS on `users` only grants a write policy to super_admin (see migration
000002) — an admin has no UPDATE policy on this table, including on their
own row. `mark_staff_active()` is SECURITY DEFINER and scoped to
`auth.uid()`, so it can only ever flip the CALLER's own row, never anyone
else's — safe to expose to any authenticated user despite bypassing RLS.
*/

CREATE TYPE staff_status AS ENUM ('pending', 'active');

ALTER TABLE users ADD COLUMN status staff_status NOT NULL DEFAULT 'active';

CREATE OR REPLACE FUNCTION public.mark_staff_active()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE users SET status = 'active' WHERE id = auth.uid() AND status = 'pending';
$$;

REVOKE ALL ON FUNCTION public.mark_staff_active() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_staff_active() TO authenticated;
