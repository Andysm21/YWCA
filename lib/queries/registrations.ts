import 'server-only';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

export type RegistrationStatus = 'pending_payment' | 'waitlisted' | 'payment_submitted' | 'confirmed' | 'refunded';
export type RegistrationEmailStatus = 'pending' | 'sent' | 'failed';

export type RegistrationRow = {
  id: string;
  registration_number: string;
  camp_id: string;
  status: RegistrationStatus;
  waitlist_position: number | null;
  camper_name: string;
  parent_name: string;
  parent_email: string;
  email: string;
  mobile_phone: string;
  created_at: string;
  email_status: RegistrationEmailStatus;
  email_failure_reason: string | null;
  camps: { name: string; price_egp: number; slug: string } | null;
};

// camps.name doesn't exist anymore — always resolved via camp_types(name).
const REGISTRATION_LIST_COLUMNS =
  'id, registration_number, camp_id, status, waitlist_position, camper_name, parent_name, parent_email, email, mobile_phone, created_at, email_status, email_failure_reason, camps(price_egp, slug, camp_types(name))';

/** Supabase returns a to-one FK join as an object; normalize defensively (see lib/queries/camps.ts for why). */
function flattenCampTypeName(campsRel: any): { name: string; price_egp: number; slug: string } | null {
  if (!campsRel) return null;
  const camp = Array.isArray(campsRel) ? campsRel[0] : campsRel;
  if (!camp) return null;
  const typeRel = camp.camp_types;
  const name = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'Unknown Camp';
  return { name, price_egp: camp.price_egp, slug: camp.slug };
}

export type RegistrationFilters = {
  campId?: string;
  status?: RegistrationStatus;
  page?: number;
  pageSize?: number;
};

/**
 * Paginated, explicit-column registrations query for the portal tables.
 * Requires an authenticated staff (admin/super_admin) session — RLS returns
 * zero rows for anyone else rather than erroring, which is expected until
 * /portal/login has real Supabase Auth wired up.
 */
export async function getRegistrationsPage({ campId, status, page = 1, pageSize = 25 }: RegistrationFilters) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  let query = supabase
    .from('registrations')
    .select(REGISTRATION_LIST_COLUMNS, { count: 'exact' });

  // Waitlist view: strict FIFO order (position ascending), not newest-first —
  // this is what makes the status filter double as the "waitlist view".
  query = status === 'waitlisted'
    ? query.order('waitlist_position', { ascending: true })
    : query.order('created_at', { ascending: false });

  if (campId) query = query.eq('camp_id', campId);
  if (status) query = query.eq('status', status);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows: RegistrationRow[] = (data ?? []).map((r: any) => ({
    ...r,
    camps: flattenCampTypeName(r.camps),
  }));

  return {
    rows,
    count: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Lightweight stats for the portal overview cards: total count (head-only,
 * no rows returned) plus a lean camp_id+price select for confirmed revenue
 * (only 2 columns, not '*'). At current camp scale (~600 campers/year) this
 * is cheap; if volume grows, move the revenue sum into a Postgres RPC to
 * aggregate server-side instead of summing in JS.
 */
export async function getRegistrationStats() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { count: totalCount, error: totalError } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true });
  if (totalError) throw totalError;

  const { count: confirmedCount, error: confirmedError } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed');
  if (confirmedError) throw confirmedError;

  const { data: revenueRows, error: revenueError } = await supabase
    .from('registrations')
    .select('camps(price_egp)')
    .eq('status', 'confirmed');
  if (revenueError) throw revenueError;

  const totalRevenue = (revenueRows ?? []).reduce(
    (sum, r: any) => sum + (r.camps?.price_egp ?? 0),
    0
  );

  return {
    totalCount: totalCount ?? 0,
    confirmedCount: confirmedCount ?? 0,
    totalRevenue,
  };
}

/**
 * Per-camp registration counts/revenue for the dashboard breakdown cards.
 * Lean select (camp_id + status + joined camp name/price/capacity only,
 * not full registration rows) — one query instead of one per camp.
 */
export async function getCampBreakdown() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data, error } = await supabase
    .from('registrations')
    .select('camp_id, status, camps(slug, price_egp, capacity, camp_types(name))');
  if (error) throw error;

  const byCamp = new Map<string, { name: string; slug: string; capacity: number; total: number; confirmed: number; revenue: number }>();
  for (const r of (data ?? []) as any[]) {
    const camp = Array.isArray(r.camps) ? r.camps[0] : r.camps;
    if (!camp) continue;
    const typeRel = camp.camp_types;
    const name = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'Unknown Camp';
    const existing = byCamp.get(r.camp_id) ?? { name, slug: camp.slug, capacity: camp.capacity, total: 0, confirmed: 0, revenue: 0 };
    existing.total += 1;
    if (r.status === 'confirmed') {
      existing.confirmed += 1;
      existing.revenue += camp.price_egp;
    }
    byCamp.set(r.camp_id, existing);
  }
  return Array.from(byCamp.entries()).map(([campId, v]) => ({ campId, ...v }));
}
