import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { requireStaff } from '@/lib/auth/require-staff';
import { sendPendingPaymentEmail, sendWaitlistEmail } from '@/lib/email';
import { recordEmailResult } from '@/lib/registration-email';
import { getMeetingPoints } from '@/lib/queries/site-settings';

const MAX_ATTEMPTS_PER_RUN = 25;

/**
 * Two ways to trigger this route:
 * 1. Vercel Cron (see vercel.json) — Vercel automatically attaches
 *    `Authorization: Bearer ${CRON_SECRET}` to cron-triggered requests
 *    when a CRON_SECRET env var is set on the project (this is the
 *    current documented mechanism — see Vercel's "Securing cron jobs"
 *    docs). Verified below; anyone else hitting this URL without that
 *    exact header gets rejected UNLESS they're an authenticated staff
 *    session (path 2).
 * 2. The manual "Retry quota-failed emails now" button on the Super
 *    Admin dashboard — a real staff session via requireStaff(), same
 *    check every other portal mutation route uses. This lets the route
 *    be tested locally (no cron in dev) and used as a fallback after
 *    deploy without waiting for the schedule.
 */
async function authorize(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  const staffAuth = await requireStaff();
  return staffAuth.ok;
}

/** Vercel Cron triggers via GET by default (see vercel.json) — shares the same handler as the manual-retry POST from the Super Admin dashboard button. */
export async function GET(request: Request) {
  return handleRetry(request);
}

export async function POST(request: Request) {
  return handleRetry(request);
}

async function handleRetry(request: Request) {
  const authorized = await authorize(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: failedLogs, error: fetchError } = await supabase
    .from('email_send_log')
    .select('id, registration_id')
    .eq('failure_type', 'quota_exceeded')
    .is('retried_at', null)
    .not('registration_id', 'is', null)
    .order('sent_at', { ascending: true })
    .limit(MAX_ATTEMPTS_PER_RUN);
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  let attempted = 0;
  let succeeded = 0;
  let stillFailed = 0;
  let stoppedEarly = false;

  for (const logRow of failedLogs ?? []) {
    attempted++;

    const { data: registration } = await supabase
      .from('registrations')
      .select('id, status, camper_name, mobile_phone, parent_email, registration_number, waitlist_position, camps(price_egp, slug, camp_types(name))')
      .eq('id', logRow.registration_id!)
      .maybeSingle();

    // Registration might have moved on since the original failure (e.g.
    // status changed, or it was deleted-adjacent via a refund) — nothing
    // meaningful to resend for anything but pending_payment/waitlisted,
    // same rule the "Resend email" portal action already follows.
    if (!registration || (registration.status !== 'pending_payment' && registration.status !== 'waitlisted')) {
      await supabase.from('email_send_log').update({ retried_at: new Date().toISOString(), retry_succeeded: false }).eq('id', logRow.id);
      stillFailed++;
      continue;
    }

    const campRel = registration.camps as any;
    const camp = Array.isArray(campRel) ? campRel[0] : campRel;
    const typeRel = camp?.camp_types;
    const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'the camp';

    const result = registration.status === 'waitlisted'
      ? await sendWaitlistEmail({
          to: registration.parent_email,
          camperName: registration.camper_name,
          registrationNumber: registration.registration_number,
          campName,
          waitlistPosition: registration.waitlist_position ?? 0,
        })
      : await sendPendingPaymentEmail({
          to: registration.parent_email,
          camperName: registration.camper_name,
          mobilePhone: registration.mobile_phone,
          registrationNumber: registration.registration_number,
          campName,
          campSlug: camp?.slug,
          priceEgp: camp?.price_egp ?? 0,
          meetingPoints: await getMeetingPoints(),
        });

    await recordEmailResult(supabase, registration.id, result);
    await supabase.from('email_send_log').update({ retried_at: new Date().toISOString(), retry_succeeded: result.status === 'sent' }).eq('id', logRow.id);

    if (result.status === 'sent') {
      succeeded++;
    } else {
      stillFailed++;
      // If quota is STILL exhausted, every remaining item in this batch
      // will fail the same way — stop burning through the list (and
      // wasting send attempts against a quota that's clearly not reset
      // yet) rather than looping through the rest for no benefit.
      if (result.failureType === 'quota_exceeded') {
        stoppedEarly = true;
        break;
      }
    }
  }

  return NextResponse.json({ attempted, succeeded, stillFailed, stoppedEarly, remaining: (failedLogs?.length ?? 0) - attempted });
}
