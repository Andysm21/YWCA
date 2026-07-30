import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { getStaffRole } from '@/lib/auth/get-staff-role';
import { isRateLimited } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Identify the caller from their session cookie — never trust a role
    // sent in the request body. This is the same cookie-authenticated client
    // pattern as everywhere else; the RPC it calls is SECURITY DEFINER and
    // resolves auth.uid() from the session JWT.
    const cookieStore = await cookies();
    const sessionClient = createServerClient(cookieStore);
    const { data: { user } } = await sessionClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Verify the caller is actually super_admin server-side. This is the
    // real authorization check for this endpoint — the Super Admin tab being
    // hidden from admins in the UI (and middleware blocking the /portal/*
    // page) are not enough on their own, since this is a separate API route.
    const role = await getStaffRole(sessionClient);
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admin can invite staff' }, { status: 403 });
    }

    // Cheap defense-in-depth on top of the super_admin gate above: caps
    // how many invite emails a compromised (or fat-fingered) super_admin
    // session/IP can fire off. Keyed on the caller's user id first (falls
    // back to IP if somehow absent) so it tracks the actual admin session
    // rather than being trivially shared across staff behind the same IP.
    if (isRateLimited(`invite-admin:${user.id}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many invites sent recently. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (fullName.length > 200) {
      return NextResponse.json({ error: 'Full name must be 200 characters or fewer.' }, { status: 400 });
    }
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      // Fail loudly rather than silently sending an invite link to
      // "undefined/portal/accept-invite" — that would repeat the exact bug
      // this route was just fixed for.
      return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL is not set — cannot build a valid invite redirect link' }, { status: 500 });
    }

    // 3. Only past this point do we touch the service-role client — it
    // bypasses RLS entirely, so it must never be reachable without the check
    // above having already passed.
    const serviceClient = createServiceClient();

    const { data: invite, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/accept-invite`,
    });
    if (inviteError) {
      // Log every field the error object actually carries — .message alone
      // has been observed to come back as the literal string "{}" when
      // Supabase's Admin API returns a body supabase-js can't map to a
      // normal message (e.g. an SMTP-side failure), so surface everything.
      console.error('[invite-admin] inviteUserByEmail failed', {
        name: inviteError.name,
        status: inviteError.status,
        code: (inviteError as { code?: string }).code,
        message: inviteError.message,
        raw: JSON.stringify(inviteError, Object.getOwnPropertyNames(inviteError)),
      });
      return NextResponse.json(
        {
          error: inviteError.message && inviteError.message !== '{}'
            ? inviteError.message
            : `Supabase Auth rejected the invite (status ${inviteError.status ?? 'unknown'}). Check the server terminal log for the full error — likely an SMTP delivery failure or the email is already registered.`,
        },
        { status: inviteError.status ?? 409 }
      );
    }
    if (!invite?.user) {
      return NextResponse.json({ error: 'Invite sent but Supabase returned no user record for it.' }, { status: 500 });
    }

    const { data: staffRow, error: insertError } = await serviceClient
      .from('users')
      .insert({
        id: invite.user.id,
        email,
        full_name: fullName,
        role: 'admin',
        status: 'pending',
        created_by: user.id,
      })
      .select('id, email, full_name, role, status, created_at')
      .single();

    if (insertError) {
      // The auth invite already went out even though the app-level `users`
      // row failed — surface this clearly rather than pretending it worked.
      return NextResponse.json(
        { error: `Invite email sent, but staff record failed to save: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ staff: staffRow });
  } catch (err) {
    // Any unhandled throw here (network failure calling Supabase Auth, a
    // missing env var, etc.) would otherwise surface to the client as an
    // opaque `{}` — Next.js redacts uncaught Route Handler errors by
    // design. Catching explicitly so the Staff tab shows what actually
    // went wrong instead of failing silently.
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[invite-admin]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
