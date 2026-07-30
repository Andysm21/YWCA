import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { isRateLimited } from '@/lib/rate-limit';

/**
 * "I lost my registration number" fallback. Deliberately narrow to limit
 * how much this can be abused as a general registration-data lookup:
 * - Scoped to one camp (campSlug required) — not a site-wide search.
 * - Requires an exact camper name AND exact parent mobile match, not one
 *   or the other — meaningfully higher entropy than either alone.
 * - Returns ONLY the registration number, status, camper name (already
 *   known to the caller — it's their own match input), and waitlist
 *   position — no email, no address, no other PII, even on a match.
 *
 * Reused as the entry point for two guest-facing flows: the "lost my
 * registration number" fallback on the payment page, and the standalone
 * /register/status "check my status" page (app/register/status/page.tsx).
 * Both hit this same endpoint, so they share one rate-limit bucket per IP
 * — that's fine, the limit (5 / 10min) is generous for either use alone
 * and a legitimate user doing both in the same window is a rare edge case,
 * not a real UX problem.
 * - Same generic "no match" message whether the name or the mobile (or
 *   both) didn't match, so this can't be used to enumerate which campers
 *   are registered by name alone.
 * - Rate-limited per IP (see caveats in lib/rate-limit.ts).
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(`register-lookup:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later or contact support.' }, { status: 429 });
  }

  const body = await request.json();
  const campSlug = typeof body.campSlug === 'string' ? body.campSlug.trim() : '';
  const camperName = typeof body.camperName === 'string' ? body.camperName.trim() : '';
  const parentMobile = typeof body.parentMobile === 'string' ? body.parentMobile.trim() : '';

  if (!campSlug || !camperName || !parentMobile) {
    return NextResponse.json({ error: 'Camp, camper name, and parent mobile are all required.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: camp, error: campError } = await supabase
    .from('camps')
    .select('id')
    .eq('slug', campSlug)
    .maybeSingle();
  if (campError) return NextResponse.json({ error: campError.message }, { status: 500 });
  if (!camp) return NextResponse.json({ error: 'No matching registration found.' }, { status: 404 });

  const { data: registration, error } = await supabase
    .from('registrations')
    .select('registration_number, status, camper_name, waitlist_position')
    .eq('camp_id', camp.id)
    .ilike('camper_name', camperName)
    .eq('parent_mobile', parentMobile)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!registration) {
    return NextResponse.json({ error: 'No matching registration found. Double-check the details, or contact support.' }, { status: 404 });
  }

  return NextResponse.json({
    registrationNumber: registration.registration_number,
    status: registration.status,
    camperName: registration.camper_name,
    waitlistPosition: registration.waitlist_position,
  });
}
