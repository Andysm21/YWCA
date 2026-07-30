import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { isRateLimited } from '@/lib/rate-limit';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/username-accounts';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(`reset-password:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!token) {
    return NextResponse.json({ error: 'Missing reset token.' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: tokenRow } = await serviceClient
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', token)
    .maybeSingle();

  // One generic error for "no such token", "already used", and "expired" —
  // no reason to help an attacker distinguish which.
  const INVALID = NextResponse.json({ error: 'This reset link is invalid or has expired. Request a new one.' }, { status: 400 });

  if (!tokenRow || tokenRow.used || new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return INVALID;
  }

  const { error: updateErr } = await serviceClient.auth.admin.updateUserById(tokenRow.user_id, { password });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message || 'Failed to update password.' }, { status: 500 });
  }

  // Mark used only after the password change actually succeeds — if the
  // update call above fails, the token stays valid so the user can retry
  // without needing to request a whole new email.
  await serviceClient.from('password_reset_tokens').update({ used: true }).eq('id', tokenRow.id);

  return NextResponse.json({ ok: true });
}
