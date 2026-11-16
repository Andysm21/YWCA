import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { sendSpotConfirmedEmail } from '@/lib/email';
import { recordEmailResult } from '@/lib/registration-email';
import { getMeetingPoints } from '@/lib/queries/site-settings';
import { newColumnsReady } from '@/lib/schema-features';
import { formatDateRange } from '@/lib/camp-data';

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

    // Final "you're registered, paid and secured" email. A send failure must never undo the confirmation.
    let emailStatus: 'sent' | 'failed' = 'failed';
    try {
      const cols = `registration_number, camper_name, parent_email${(await newColumnsReady()) ? ', bus_pickup' : ''}, camps(price_egp, date_start, date_end, camp_types(name))`;
      const { data: full } = await supabase.from('registrations').select(cols).eq('id', params.id).maybeSingle();
      const row = full as any;
      const campRel = row?.camps;
      const camp = Array.isArray(campRel) ? campRel[0] : campRel;
      if (row && camp) {
        const typeRel = camp.camp_types;
        const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'the camp';
        const result = await sendSpotConfirmedEmail({
          to: row.parent_email,
          camperName: row.camper_name,
          registrationNumber: row.registration_number,
          campName,
          dateRange: formatDateRange(camp.date_start, camp.date_end),
          priceEgp: camp.price_egp,
          meetingPoints: await getMeetingPoints(),
          busPickup: row.bus_pickup ?? null,
        });
        await recordEmailResult(supabase, params.id, result);
        emailStatus = result.status;
      }
    } catch (emailError) {
      console.error('[confirm-payment] confirmation email failed', emailError);
    }

    return NextResponse.json({ registration, emailStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[confirm-payment]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
