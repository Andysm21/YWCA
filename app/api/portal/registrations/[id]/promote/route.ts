import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { recordEmailResult } from '@/lib/registration-email';
import { sendWaitlistPromotedEmail } from '@/lib/email';

/**
 * waitlisted -> pending_payment (strict FIFO, per the schema doc). Enforces
 * promotion order server-side — you can't promote someone out of turn even
 * if the UI only shows the button on the first row, since that's a UI
 * nicety, not the actual guard.
 *
 * FIFO can be explicitly overridden with `{ force: true }` in the request
 * body — legitimate real-world case: the front of the queue is
 * unreachable/declined and staff need to move to the next person without
 * hand-editing waitlist_position. The override is a conscious per-request
 * choice made by the caller (the portal UI requires a second, more
 * specific confirmation dialog before sending force:true — see
 * registration-actions-cell.tsx), and is recorded in the audit log either
 * way (`out_of_order: true/false`) so it's visible who bypassed FIFO and
 * when, not silently allowed.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = await request.json().catch(() => ({}));
    const force = body?.force === true;

    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('id, status, camp_id, camper_name, parent_email, registration_number, waitlist_position, camps(price_egp, slug, date_start, date_end, camp_types(name))')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!registration) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    if (registration.status !== 'waitlisted') {
      return NextResponse.json(
        { error: `Cannot promote — this registration is "${registration.status.replace('_', ' ')}", not "waitlisted".` },
        { status: 409 }
      );
    }

    // Strict FIFO: refuse if there's an earlier-positioned waitlisted
    // registration for the same camp still waiting.
    const { data: earlier, error: earlierError } = await supabase
      .from('registrations')
      .select('id, waitlist_position')
      .eq('camp_id', registration.camp_id)
      .eq('status', 'waitlisted')
      .lt('waitlist_position', registration.waitlist_position ?? 0)
      .order('waitlist_position', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (earlierError) return NextResponse.json({ error: earlierError.message }, { status: 500 });
    if (earlier && !force) {
      return NextResponse.json(
        { error: `There's an earlier waitlisted registration (position ${earlier.waitlist_position}) — promote in FIFO order.`, outOfOrder: true, earlierPosition: earlier.waitlist_position },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from('registrations')
      .update({ status: 'pending_payment', waitlist_position: null, promoted_from_waitlist_at: new Date().toISOString() })
      .eq('id', registration.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'promote_waitlist', 'registration', registration.id, {
      camper_name: registration.camper_name,
      out_of_order: Boolean(earlier),
      ...(earlier ? { skipped_ahead_of_position: earlier.waitlist_position } : {}),
    });

    // Best-effort notification — the status transition above already
    // succeeded and is the source of truth regardless of email outcome.
    try {
      const campRel = registration.camps as any;
      const camp = Array.isArray(campRel) ? campRel[0] : campRel;
      const typeRel = camp?.camp_types;
      const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'the camp';

      const result = await sendWaitlistPromotedEmail({
        to: registration.parent_email,
        camperName: registration.camper_name,
        registrationNumber: registration.registration_number,
        campName,
        campSlug: camp?.slug,
        priceEgp: camp?.price_egp ?? 0,
      });
      await recordEmailResult(supabase, registration.id, result);
    } catch (emailError) {
      console.error('[promote] notification email failed', emailError);
      await recordEmailResult(supabase, registration.id, { status: 'failed', reason: emailError instanceof Error ? emailError.message : 'Unknown error', failureType: 'other' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[promote]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
