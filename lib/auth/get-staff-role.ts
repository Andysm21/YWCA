import type { SupabaseClient } from '@supabase/supabase-js';

export type StaffRole = 'admin' | 'super_admin';

/**
 * Resolves the calling session's staff role via the `current_staff_role()`
 * Postgres function (SECURITY DEFINER — bypasses the `users` table's RLS,
 * which otherwise has no SELECT policy for admins, only super_admin).
 *
 * This is the ONLY source of truth for "what role is this session" anywhere
 * in the app — never trust a client-supplied role. Works with any
 * cookie-authenticated Supabase client (middleware or server component),
 * since the RPC resolves `auth.uid()` from the session JWT the client is
 * carrying. Returns null if unauthenticated or the auth user has no row in
 * `users` (i.e. not staff).
 */
export async function getStaffRole(supabase: SupabaseClient): Promise<StaffRole | null> {
  const { data, error } = await supabase.rpc('current_staff_role');
  if (error || !data) return null;
  return data as StaffRole;
}

/** Single source of truth for "which dashboard does this role land on" — used by middleware, login, and accept-invite so the mapping never drifts between them. */
export const ROLE_HOME: Record<StaffRole, string> = {
  admin: '/portal/admin',
  super_admin: '/portal/super-admin',
};

/** Resolves the calling session's role and maps it straight to its dashboard path, or null if not staff. */
export async function resolveStaffDashboardPath(supabase: SupabaseClient): Promise<string | null> {
  const role = await getStaffRole(supabase);
  return role ? ROLE_HOME[role] : null;
}
