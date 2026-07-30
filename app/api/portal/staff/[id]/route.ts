import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';

const VALID_STATUSES = ['active', 'inactive'];

/**
 * Activate/deactivate a staff account. Only super_admin can do this — an
 * admin cannot deactivate other admins or themselves. Deactivation is
 * enforced at the auth layer by `current_staff_role()` (see migration
 * 20260802000002), which excludes `status = 'inactive'` rows — this route
 * just flips the flag that function reads.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = await request.json();
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Status must be active or inactive.' }, { status: 400 });
    }

    // A super_admin must never be able to deactivate their own account —
    // that would lock them out with no other super_admin able to reverse it
    // (unless one exists, which we can't assume). Compare against the
    // caller's own id from the verified session, not anything client-supplied.
    if (params.id === userId) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
    }

    const { data: before, error: beforeError } = await supabase
      .from('users')
      .select('id, email, full_name, status')
      .eq('id', params.id)
      .maybeSingle();
    if (beforeError) return NextResponse.json({ error: beforeError.message }, { status: 500 });
    if (!before) return NextResponse.json({ error: 'Staff account not found' }, { status: 404 });

    const { data: staff, error } = await supabase
      .from('users')
      .update({ status: body.status })
      .eq('id', params.id)
      .select('id, email, full_name, role, status, created_at')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(
      supabase,
      userId,
      body.status === 'inactive' ? 'deactivate_staff' : 'activate_staff',
      'user',
      staff.id,
      { email: staff.email, full_name: staff.full_name, before: before.status, after: staff.status }
    );

    return NextResponse.json({ staff });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[staff PATCH]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
