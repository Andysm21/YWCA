import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/require-staff';
import { createServiceClient } from '@/utils/supabase/service';
import { isRateLimited } from '@/lib/rate-limit';
import { USERNAME_PATTERN, MIN_PASSWORD_LENGTH, normalizeUsername, syntheticEmailForUsername } from '@/lib/auth/username-accounts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  // Same cheap defense-in-depth cap as invite-admin — keyed on the caller's
  // own user id so it tracks the actual admin session.
  if (isRateLimited(`staff-create-direct:${auth.userId}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many accounts created recently. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const usernameRaw = typeof body?.username === 'string' ? body.username.trim() : '';
  const recoveryEmail = typeof body?.recoveryEmail === 'string' ? body.recoveryEmail.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!fullName) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }
  if (fullName.length > 200) {
    return NextResponse.json({ error: 'Full name must be 200 characters or fewer.' }, { status: 400 });
  }
  if (!USERNAME_PATTERN.test(usernameRaw)) {
    return NextResponse.json({ error: 'Username must be 3-30 characters: letters and numbers, with dots or underscores between them (e.g. jane.doe).' }, { status: 400 });
  }
  // Recovery email is optional — it only enables password-reset emails.
  if (recoveryEmail && !EMAIL_PATTERN.test(recoveryEmail)) {
    return NextResponse.json({ error: 'That recovery email is not valid' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 });
  }

  const username = normalizeUsername(usernameRaw);
  const serviceClient = createServiceClient();

  const { data: existing } = await serviceClient
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
  }

  const syntheticEmail = syntheticEmailForUsername(username);

  // email_confirm: true — this is a direct creation, not an invite, so
  // there's no acceptance step and no confirmation email is sent (it
  // couldn't be anyway; the address is synthetic and unreachable).
  const { data: created, error: createErr } = await serviceClient.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
  });
  if (createErr) {
    console.error('[staff/create-direct] createUser failed', {
      status: createErr.status,
      message: createErr.message,
    });
    return NextResponse.json(
      { error: createErr.message || `Failed to create account (status ${createErr.status ?? 'unknown'}).` },
      { status: createErr.status ?? 500 }
    );
  }
  if (!created?.user) {
    return NextResponse.json({ error: 'Account created but Supabase returned no user record for it.' }, { status: 500 });
  }

  // No 'pending' state here — unlike the invite flow there's no acceptance
  // step to wait for, the Super Admin already has the password in hand.
  const { data: staffRow, error: insertError } = await serviceClient
    .from('users')
    .insert({
      id: created.user.id,
      email: syntheticEmail,
      full_name: fullName,
      role: 'admin',
      status: 'active',
      username,
      recovery_email: recoveryEmail || null,
      created_by: auth.userId,
    })
    .select('id, email, full_name, role, status, username, recovery_email, created_at')
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: `Auth account created, but staff record failed to save: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ staff: staffRow });
}
