import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Plain anon-key client with no cookie/session plumbing — for public,
 * unauthenticated reads (guest RLS policies key off the `anon` Postgres
 * role, not a user session, so no cookies are needed here). Safe to call
 * from generateStaticParams / build-time contexts, unlike the cookie-based
 * server client, which requires an active request scope and throws
 * ("cookies() expects to have requestAsyncStorage") if called outside one.
 */
export function createAnonClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
