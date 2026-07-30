import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { isRateLimited } from '@/lib/rate-limit';

/**
 * Server-side login for the staff portal. Moves `signInWithPassword` off
 * the browser (which had zero rate-limiting or abuse control in front of
 * Supabase's API) and behind an IP rate limit, and lets us return one
 * generic error message regardless of whether the email exists or the
 * password is wrong — avoiding user enumeration.
 *
 * Uses the same cookie-authenticated `@supabase/ssr` server client as every
 * other portal route (see utils/supabase/server.ts) — its `setAll` writes
 * straight to the Next.js cookie store for this response, so a successful
 * `signInWithPassword` here leaves the browser holding the httpOnly
 * session cookies Supabase issues, no extra wiring needed. The client then
 * just redirects; middleware's `supabase.auth.getUser()` picks up the
 * session on the very next request.
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(`portal-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many login attempts. Please try again in a few minutes.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Deliberately generic — never reveal whether the email exists.
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
