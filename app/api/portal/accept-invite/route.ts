import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { isRateLimited } from '@/lib/rate-limit';

/**
 * Server-side counterpart to the accept-invite page's password-set step.
 * The magic-link session establishment (setSession()/verifyOtp()) stays
 * entirely client-side in app/portal/accept-invite/page.tsx — untouched —
 * this route only fronts the final `updateUser({ password })` call with a
 * rate limit.
 *
 * The client already holds a live Supabase session (from the invite link)
 * at the point it calls this route, but that session lives in the browser
 * client's storage, not in this server route's cookie jar (this route was
 * never hit before, so no cookies were ever set for it). So the client
 * sends the access token it already has via the Authorization header, and
 * we use it to authenticate the update — same "trust the token, not
 * anything else the client claims" posture as every other server route
 * here, just via a bearer token instead of a cookie for this one case.
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(`accept-invite:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (!accessToken) {
    return NextResponse.json({ error: 'Missing session. Please reopen your invite link.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // Verify the bearer token identifies a real, current user before doing
  // anything with it — getUser(token) validates against Supabase Auth
  // rather than trusting the token's claims at face value.
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return NextResponse.json({ error: 'Your session has expired. Please reopen your invite link.' }, { status: 401 });
  }

  // Update the password via the service-role admin API by the already
  // -verified user id, rather than trying to reconstruct a client session
  // from a bare access token server-side (which would need a refresh token
  // we were never given). Same "only touch the service client after the
  // caller is verified" posture as invite-admin's route.
  const serviceClient = createServiceClient();
  const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.id, { password });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
