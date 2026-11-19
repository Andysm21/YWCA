import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { createServiceClient } from '@/utils/supabase/service';
import { writeAuditLog } from '@/lib/audit';
import { recordEmailResult } from '@/lib/registration-email';
import { sendPendingPaymentEmail, sendWaitlistEmail, sendWaitlistPromotedEmail, sendSpotConfirmedEmail, type SendResult } from '@/lib/email';
import { formatDateRange } from '@/lib/camp-data';
import { getMeetingPoints } from '@/lib/queries/site-settings';
import { emailKindFor } from '@/lib/registration-email-kind';
import { isValidEmail } from '@/lib/validation/registration';

/**
 * Send (or re-send) the email that matches a registration's CURRENT status:
 *   pending payment            -> payment email
 *   pending payment + promoted -> "it's your turn" email
 *   confirmed                  -> "you're in" confirmation
 *   waitlisted                 -> waitlist email
 * Recipient: the guardian's email by default, or `to` (another address) when
 * the admin typed one. Sending to another address does not touch the
 * registration's own delivery status, only the send log. Admin + Super Admin.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = await request.json().catch(() => ({}));
    const customTo = typeof body?.to === 'string' ? body.to.trim().toLowerCase() : '';
    if (customTo && !isValidEmail(customTo)) {
      return NextResponse.json({ error: 'That email address is not valid.' }, { status: 400 });
    }

    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('*, camps(price_egp, slug, date_start, date_end, camp_types(name))')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!registration) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const campRel = (registration as any).camps;
    const camp = Array.isArray(campRel) ? campRel[0] : campRel;
    if (!camp) return NextResponse.json({ error: 'Camp not found for this registration' }, { status: 500 });
    const typeRel = camp.camp_types;
    const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'the camp';

    const spec = emailKindFor(registration.status, registration.promoted_from_waitlist_at);
    if (!spec) {
      return NextResponse.json(
        { error: `There is no email for a "${registration.status.replace('_', ' ')}" registration.` },
        { status: 400 }
      );
    }

    const to = customTo || registration.parent_email;
    const common = { to, camperName: registration.camper_name, registrationNumber: registration.registration_number, campName };

    let result: SendResult;
    switch (spec.kind) {
      case 'waitlist':
        result = await sendWaitlistEmail({ ...common, waitlistPosition: registration.waitlist_position ?? 0 });
        break;
      case 'promoted':
        result = await sendWaitlistPromotedEmail({ ...common, campSlug: camp.slug, priceEgp: camp.price_egp });
        break;
      case 'pending_payment':
        result = await sendPendingPaymentEmail({
          ...common,
          mobilePhone: registration.mobile_phone,
          campSlug: camp.slug,
          priceEgp: camp.price_egp,
          meetingPoints: await getMeetingPoints(),
          busPickup: registration.bus_pickup ?? undefined,
        });
        break;
      case 'confirmed':
        result = await sendSpotConfirmedEmail({
          ...common,
          dateRange: formatDateRange(camp.date_start, camp.date_end),
          priceEgp: camp.price_egp,
          meetingPoints: await getMeetingPoints(),
          busPickup: registration.bus_pickup ?? null,
        });
        break;
    }

    if (customTo && customTo !== registration.parent_email) {
      // Sent to someone else: log it for the daily-usage numbers, but leave the registration's own email status alone.
      await createServiceClient().from('email_send_log').insert({
        status: result.status,
        failure_type: result.status === 'failed' ? result.failureType : null,
        failure_reason: result.status === 'failed' ? result.reason : null,
        registration_id: registration.id,
      });
    } else {
      await recordEmailResult(supabase, registration.id, result);
    }
    await writeAuditLog(supabase, userId, 'resend_email', 'registration', registration.id, {
      kind: spec.kind,
      to,
      to_guardian: to === registration.parent_email,
      outcome: result.status,
    });

    if (result.status === 'failed') {
      return NextResponse.json({ error: result.reason }, { status: 502 });
    }
    return NextResponse.json({ success: true, to, label: spec.label });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[resend-email]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
