/*
# current_staff_role() excludes inactive staff

## Summary
Redefines `public.current_staff_role()` to exclude rows where
`status = 'inactive'`. This is the single trust boundary every staff-role
check in the app goes through — middleware's route gating and every
`requireSuperAdmin()`/`requireStaff()` API-route guard call this same
function (directly or via `getStaffRole()`), so filtering out inactive
staff here closes the access gap for all of them at once, not just one
code path. A deactivated user's session now resolves to the same "not
staff" (null) outcome as an unauthenticated request.

Must be a separate migration from 20260802000001 (which added the
`inactive` enum value) — Postgres won't let a new enum value be used in
the same transaction that created it.
*/

CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid() AND status != 'inactive';
$$;
