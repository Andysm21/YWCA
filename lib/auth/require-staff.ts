import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { getStaffRole } from '@/lib/auth/get-staff-role';

type RequireStaffResult =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Every Super-Admin-only mutation route calls this first. Verifies the
 * caller server-side via the session cookie + the SECURITY DEFINER
 * current_staff_role() RPC — never trusts anything the client claims.
 *
 * Returns the SAME cookie-authenticated client for the caller to run their
 * mutation with (not a service-role client) — RLS's existing super_admin
 * "full" policies on seasons/camps/news_posts/gallery_images/audit_log
 * already permit everything these routes do, so this check is
 * belt-and-suspenders on top of RLS, not a replacement for it. If this
 * check ever had a bug, RLS still blocks the write.
 */
export async function requireSuperAdmin(): Promise<RequireStaffResult> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const role = await getStaffRole(supabase);
  if (role !== 'super_admin') {
    return { ok: false, response: NextResponse.json({ error: 'Only Super Admin can perform this action' }, { status: 403 }) };
  }

  return { ok: true, supabase, userId: user.id };
}

/**
 * Same pattern as requireSuperAdmin(), but accepts either staff role —
 * for routes where RLS itself already grants both (news_posts and
 * gallery_images use is_admin(), which is true for admin OR super_admin;
 * see migrations 000009/000010). Only use this where the underlying RLS
 * policy actually matches — seasons/camps stay on requireSuperAdmin()
 * since their RLS is genuinely super_admin-only.
 */
export async function requireStaff(): Promise<RequireStaffResult> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const role = await getStaffRole(supabase);
  if (!role) {
    return { ok: false, response: NextResponse.json({ error: 'Only staff can perform this action' }, { status: 403 }) };
  }

  return { ok: true, supabase, userId: user.id };
}
