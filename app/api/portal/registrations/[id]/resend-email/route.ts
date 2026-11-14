import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { recordEmailResult } from '@/lib/registration-email';
import { sendPendingPaymentEmail, sendWaitlistEmail, sendSpotConfirmedEmail } from '@/lib/email';
import { formatDateRange } from '@/lib/camp-data';
import { getMeetingPoints } from '@/lib/queries/site-settings';

/**
 * Resend the confirmation/waitlist email for a registration whose
 * email_status is 'failed' (bad address, SMTP hiccup, etc). Uses the same
 * cookie-authenticated client requireStaff() returns — RLS's
 * staff_update_registrations policy already allows admin+super_admin to
 * write email_status/email_failure_reason (those columns aren't in the
 * enforce_admin_registration_update trigger's protected list, only camper/
 * guardian identity fields are), so no service-role client needed here.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('id, registration_number, status, camper_name, mobile_phone, parent_email, waitlist_position, camp_id, camps(price_egp, slug, date_start, date_end, camp_types(name))')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!registration) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const campRel = registration.camps as any;
    const camp = Array.isArray(campRel) ? campRel[0] : campRel;
    if (!camp) return NextResponse.json({ error: 'Camp not found for this registration' }, { status: 500 });
    const typeRel = camp.camp_types;
    const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'the camp';

    let result;
    if (registration.status === 'waitlisted') {
      result = await sendWaitlistEmail({
        to: registration.parent_email,
        camperName: registration.camper_name,
        registrationNumber: registration.registration_number,
        campName,
        waitlistPosition: registration.waitlist_position ?? 0,
      });
    } else if (registration.status === 'pending_payment') {
      result = await sendPendingPaymentEmail({
        to: registration.parent_email,
        camperName: registration.camper_name,
        mobilePhone: registration.mobile_phone,
        registrationNumber: registration.registration_number,
        campName,
        campSlug: camp.slug,
        priceEgp: camp.price_egp,
        meetingPoints: await getMeetingPoints(),
      });
    } else if (registration.status === 'confirmed') {
      result = await sendSpotConfirmedEmail({
        to: registration.parent_email,
        camperName: registration.camper_name,
        registrationNumber: registration.registration_number,
        campName,
        dateRange: formatDateRange(camp.date_start, camp.date_end),
        priceEgp: camp.price_egp,
        meetingPoints: await getMeetingPoints(),
      });
    } else {
      return NextResponse.json(
        { error: `No confirmation email applies to a "${registration.status.replace('_', ' ')}" registration.` },
        { status: 400 }
      );
    }

    await recordEmailResult(supabase, registration.id, result);
    await writeAuditLog(supabase, userId, 'resend_email', 'registration', registration.id, {
      to: registration.parent_email,
      outcome: result.status,
    });

    if (result.status === 'failed') {
      return NextResponse.json({ error: result.reason }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[resend-email]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
