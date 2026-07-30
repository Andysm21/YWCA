import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { isRateLimited } from '@/lib/rate-limit';
import { normalizeUsername } from '@/lib/auth/username-accounts';

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
 *
 * Accepts a single "identifier" field that is either a real email (invited
 * Admins, Super Admin — unchanged behavior) or a username (directly-created
 * Admins, see lib/auth/username-accounts.ts). Branching rule: contains '@'
 * -> treated as email, used as-is. No '@' -> treated as a username, resolved
 * to its synthetic internal email via a service-role lookup (usernames
 * aren't readable through RLS, and there's no session yet to authenticate
 * as at this point in the flow). Either branch ends at the exact same
 * signInWithPassword call with exactly one generic error message on any
 * failure — wrong password, unknown email, AND unknown username all look
 * identical to the caller, so this can't be used to enumerate which
 * usernames or emails exist.
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(`portal-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many login attempts. Please try again in a few minutes.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 400 });
  }

  const GENERIC_ERROR = NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });

  let email: string;
  if (identifier.includes('@')) {
    email = identifier;
  } else {
    const username = normalizeUsername(identifier);
    const serviceClient = createServiceClient();
    const { data: staffRow } = await serviceClient
      .from('users')
      .select('email')
      .eq('username', username)
      .maybeSingle();
    if (!staffRow) {
      // Unknown username — same response as a wrong password, so the
      // caller can't tell "no such username" from "wrong password".
      return GENERIC_ERROR;
    }
    email = staffRow.email;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return GENERIC_ERROR;
  }

  return NextResponse.json({ ok: true });
}
