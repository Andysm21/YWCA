/*
# Staff users table

## Summary
Admin/Super Admin accounts only — guests never get a row here. `id` matches
`auth.uid()` from Supabase Auth (row is created alongside the auth user).

## RLS (per schema doc)
Guest: none. Admin: none. Super Admin: full.

Note: staff still need to resolve their OWN role to pass `is_admin()` checks
elsewhere — that's handled by the SECURITY DEFINER `current_staff_role()`
from the previous migration, which bypasses this table's RLS safely (it only
ever returns facts about the calling `auth.uid()`, never arbitrary rows).
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_full_users" ON users;
CREATE POLICY "super_admin_full_users"
ON users FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());
