import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createServiceClient } from '@/utils/supabase/service';
import { isRateLimited } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email';
import { normalizeUsername } from '@/lib/auth/username-accounts';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Unauthenticated by design (that's the whole point of a password reset),
 * so this is a straightforward enumeration/abuse target. Two defenses:
 * rate limiting by IP, and a single generic response regardless of whether
 * the username exists, has a recovery email, or even is a username-based
 * account at all — the caller can never distinguish these cases.
 */
const genericResponse = () => NextResponse.json({
  message: 'If that username exists and has a recovery email on file, a reset link has been sent to it.',
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(`forgot-password:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const usernameRaw = typeof body?.username === 'string' ? body.username.trim() : '';
  if (!usernameRaw) {
    return genericResponse();
  }

  const username = normalizeUsername(usernameRaw);
  const serviceClient = createServiceClient();

  const { data: staffRow } = await serviceClient
    .from('users')
    .select('id, recovery_email')
    .eq('username', username)
    .maybeSingle();

  if (staffRow?.recovery_email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    const { error: insertError } = await serviceClient
      .from('password_reset_tokens')
      .insert({ user_id: staffRow.id, token, expires_at: expiresAt });

    if (!insertError) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
      const resetUrl = `${siteUrl}/portal/reset-password?token=${encodeURIComponent(token)}`;
      // Best-effort — a send failure here still isn't distinguishable to
      // the caller from "no recovery email on file", by design.
      await sendPasswordResetEmail({ to: staffRow.recovery_email, resetUrl }).catch(() => null);
    }
  }

  return genericResponse();
}
