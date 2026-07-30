/*
# Enums and role-check helper functions

## Summary
Foundational types and SECURITY DEFINER helper functions used by every RLS
policy in later migrations. `users` has RLS that blocks direct reads for
non-super-admins, so policies elsewhere can't just `SELECT role FROM users`
inline — they call these helpers, which run with definer (postgres)
privileges and only ever return facts about the calling `auth.uid()`.

## New types
- `user_role`: admin | super_admin
- `season_type`: summer | winter
- `season_status`: draft | open | closed
- `camp_status`: coming_soon | open | closed
- `registration_status`: pending_payment | waitlisted | payment_submitted | confirmed | refunded
- `document_type`: certificate | payment_screenshot

## New functions
- `public.current_staff_role()` — role of the calling authenticated user from
  `users`, or null if not staff.
- `public.is_admin()` — true for admin or super_admin.
- `public.is_super_admin()` — true for super_admin only.
- `public.set_updated_at()` — generic trigger to stamp `updated_at`.
*/

CREATE TYPE user_role AS ENUM ('admin', 'super_admin');
CREATE TYPE season_type AS ENUM ('summer', 'winter');
CREATE TYPE season_status AS ENUM ('draft', 'open', 'closed');
CREATE TYPE camp_status AS ENUM ('coming_soon', 'open', 'closed');
CREATE TYPE registration_status AS ENUM ('pending_payment', 'waitlisted', 'payment_submitted', 'confirmed', 'refunded');
CREATE TYPE document_type AS ENUM ('certificate', 'payment_screenshot');

-- users table is created in the next migration; these functions are defined
-- here but only become callable once it exists (same migration set).
CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_staff_role() IN ('admin', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_staff_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
