import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Service-role client — bypasses RLS entirely. Server-only (route handlers,
 * server actions). Never import this from a client component or anything
 * that could end up in a browser bundle.
 */
export const createServiceClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service-role environment variables');
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
