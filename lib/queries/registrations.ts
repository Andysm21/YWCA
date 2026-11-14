import 'server-only';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { newColumnsReady } from '@/lib/schema-features';

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
  date_of_birth: string | null;
  academic_year: string | null;
  tshirt_size: string | null;
  bus_pickup?: string | null;
  camps: { name: string; price_egp: number; slug: string } | null;
};

// camps.name doesn't exist anymore — always resolved via camp_types(name).
const REGISTRATION_LIST_COLUMNS =
  'id, registration_number, camp_id, status, waitlist_position, camper_name, parent_name, parent_email, email, mobile_phone, created_at, email_status, email_failure_reason, date_of_birth, academic_year, tshirt_size, camps(price_egp, slug, camp_types(name))';

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
  /** Free-text match on camper/guardian name, emails, phone, registration number. */
  search?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Paginated, explicit-column registrations query for the portal tables.
 * Requires an authenticated staff (admin/super_admin) session — RLS returns
 * zero rows for anyone else rather than erroring, which is expected until
 * /portal/login has real Supabase Auth wired up.
 */
export async function getRegistrationsPage({ campId, status, search, page = 1, pageSize = 25 }: RegistrationFilters) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  let query = supabase
    .from('registrations')
    .select(((await newColumnsReady()) ? REGISTRATION_LIST_COLUMNS.replace('tshirt_size,', 'tshirt_size, bus_pickup,') : REGISTRATION_LIST_COLUMNS) as string, { count: 'exact' });

  // Waitlist view: strict FIFO order (position ascending), not newest-first —
  // this is what makes the status filter double as the "waitlist view".
  query = status === 'waitlisted'
    ? query.order('waitlist_position', { ascending: true })
    : query.order('created_at', { ascending: false });

  if (campId) query = query.eq('camp_id', campId);
  if (status) query = query.eq('status', status);
  const term = search?.trim().replace(/[%,()*]/g, ' ');
  if (term) {
    const like = `%${term}%`;
    query = query.or(['camper_name', 'parent_name', 'email', 'parent_email', 'mobile_phone', 'parent_mobile', 'registration_number', 'school'].map((c) => `${c}.ilike.${like}`).join(','));
  }

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

export type RegistrationDocument = {
  id: string;
  type: 'certificate' | 'payment_screenshot';
  drive_file_id: string;
  drive_file_url: string;
  file_name: string;
  file_size_bytes: number;
  uploaded_at: string;
};

/** Every column of one registration + its camp, season and uploaded documents (for the detail page). */
export async function getRegistrationDetail(id: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data, error } = await supabase
    .from('registrations')
    .select('*, camps(id, slug, price_egp, date_start, date_end, capacity, camp_types(name), seasons(type, year))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: docs, error: docsError } = await supabase
    .from('registration_documents')
    .select('id, type, drive_file_id, drive_file_url, file_name, file_size_bytes, uploaded_at')
    .eq('registration_id', id)
    .order('uploaded_at', { ascending: true });
  if (docsError) throw docsError;

  const row = data as any;
  const campRel = Array.isArray(row.camps) ? row.camps[0] : row.camps;
  const typeRel = campRel?.camp_types;
  const seasonRel = campRel?.seasons;
  const season = Array.isArray(seasonRel) ? seasonRel[0] : seasonRel;
  return {
    registration: row as Record<string, any>,
    camp: campRel
      ? {
          id: campRel.id as string,
          slug: campRel.slug as string,
          name: ((Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'Unknown Camp') as string,
          price: campRel.price_egp as number,
          dateStart: campRel.date_start as string,
          dateEnd: campRel.date_end as string,
          season: season ? (`${season.type === 'winter' ? 'Winter' : 'Summer'} ${season.year}`) : '',
        }
      : null,
    documents: (docs ?? []) as RegistrationDocument[],
  };
}

export type CampInsights = {
  total: number;
  byGrade: [string, number][];
  byTshirt: [string, number][];
  byBus: [string, number][];
  firstTimers: number;
  withMedical: number;
  missingDocuments: number;
};

/** Lean per-camp breakdowns (active registrations only: everything except refunded) for the camp page charts. */
export async function getCampInsights(campId: string): Promise<CampInsights> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const withBus = await newColumnsReady();
  const { data, error } = await supabase
    .from('registrations')
    .select(`id, status, academic_year, tshirt_size, first_time_camper, medical_condition${withBus ? ', bus_pickup' : ''}`)
    .eq('camp_id', campId)
    .neq('status', 'refunded');
  if (error) throw error;
  const rows = (data ?? []) as any[];

  const tally = (pick: (r: any) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = (pick(r) ?? '').toString().trim() || '—';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  };

  const { data: docRows } = await supabase
    .from('registration_documents')
    .select('registration_id')
    .in('registration_id', rows.length ? rows.map((r) => r.id) : ['00000000-0000-0000-0000-000000000000']);
  const withDocs = new Set((docRows ?? []).map((d: any) => d.registration_id));
  const needDocs = rows.filter((r) => r.status === 'payment_submitted' || r.status === 'confirmed');

  return {
    total: rows.length,
    byGrade: tally((r) => r.academic_year),
    byTshirt: tally((r) => r.tshirt_size),
    byBus: withBus ? tally((r) => r.bus_pickup) : [],
    firstTimers: rows.filter((r) => r.first_time_camper).length,
    withMedical: rows.filter((r) => (r.medical_condition ?? '').trim()).length,
    missingDocuments: needDocs.filter((r) => !withDocs.has(r.id)).length,
  };
}
