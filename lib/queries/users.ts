import 'server-only';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

export type StaffUser = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  username: string | null;
  recovery_email: string | null;
};

/**
 * Staff directory for the Super Admin "Staff" tab. RLS on `users` only
 * grants super_admin a SELECT policy (see migration 000002) — an admin
 * session calling this gets zero rows, not an error.
 */
export async function getStaffUsers(): Promise<StaffUser[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, status, created_at, username, recovery_email')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data ?? [];
}
