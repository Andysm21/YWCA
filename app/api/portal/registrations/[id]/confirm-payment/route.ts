import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';

/** payment_submitted -> confirmed. Admin or Super Admin (RLS's staff_update_registrations already covers both — status/confirmed_by/confirmed_at aren't in the admin-protected-column trigger). */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const { data: before, error: fetchError } = await supabase
      .from('registrations')
      .select('id, status, camper_name')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!before) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    if (before.status !== 'payment_submitted') {
      return NextResponse.json(
        { error: `Cannot confirm — this registration is "${before.status.replace('_', ' ')}", not "payment submitted".` },
        { status: 409 }
      );
    }

    const { data: registration, error } = await supabase
      .from('registrations')
      .update({ status: 'confirmed', confirmed_by: userId, confirmed_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('id, status')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'confirm_payment', 'registration', registration.id, { camper_name: before.camper_name });

    return NextResponse.json({ registration });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[confirm-payment]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
