import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';

/**
 * confirmed -> refunded. Per the schema's state machine, this deliberately
 * does NOT reopen the camp's capacity — the spot stays counted as used;
 * Admin/Super Admin manually promotes from the waitlist separately if they
 * want to backfill the spot. Admin or Super Admin (same RLS reasoning as
 * confirm-payment — these columns aren't in the admin-protected list).
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = await request.json();
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      return NextResponse.json({ error: 'A refund reason is required.' }, { status: 400 });
    }

    const { data: before, error: fetchError } = await supabase
      .from('registrations')
      .select('id, status, camper_name')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!before) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    if (before.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Cannot refund — this registration is "${before.status.replace('_', ' ')}", not "confirmed".` },
        { status: 409 }
      );
    }

    const { data: registration, error } = await supabase
      .from('registrations')
      .update({ status: 'refunded', refunded_by: userId, refunded_at: new Date().toISOString(), refund_reason: reason })
      .eq('id', params.id)
      .select('id, status')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'mark_refund', 'registration', registration.id, { camper_name: before.camper_name, reason });

    return NextResponse.json({ registration });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[refund]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
