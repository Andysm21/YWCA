import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createAnonClient } from '@/utils/supabase/anon';
import { newColumnsReady } from '@/lib/schema-features';
import { cookies } from 'next/headers';
import {
  deriveCampVisuals,
  deriveSeasonIcon,
  getDisplayStatus,
  type Camp,
  type Season,
  type CampDbStatus,
  type SeasonDbStatus,
} from '@/lib/camp-data';

// Camp names are never stored on `camps` — always resolved via the
// camp_type_id -> camp_types.name join (see migration 20260731000001).
const BASE_CAMP_COLUMNS = 'id, slug, age_min, age_max, price_egp, capacity, date_start, date_end, description, cover_photo_url, status, season_id, camp_type_id, camp_types(name)';
async function campColumns(): Promise<string> {
  return (await newColumnsReady()) ? BASE_CAMP_COLUMNS.replace('camp_type_id,', 'camp_type_id, dob_min, dob_max,') : BASE_CAMP_COLUMNS;
}
const SEASON_COLUMNS = 'id, type, year, status';

type CampRow = {
  id: string;
  slug: string;
  age_min: number;
  age_max: number;
  price_egp: number;
  capacity: number;
  date_start: string;
  date_end: string;
  description: string;
  cover_photo_url: string | null;
  status: CampDbStatus;
  season_id: string;
  camp_type_id: string;
  dob_min?: string | null;
  dob_max?: string | null;
  camp_types: { name: string } | { name: string }[] | null;
};

type SeasonRow = {
  id: string;
  type: 'summer' | 'winter';
  year: number;
  status: SeasonDbStatus;
};

function getAnonClient() {
  // Public pages don't need a user session — the anon key + RLS is enough
  // (guest policies already scope to open seasons / non-closed camps). Uses
  // the plain no-cookie anon client (not the cookie-based server client)
  // specifically so this is safe to call from generateStaticParams, which
  // runs at build time with no request scope — cookies() throws there.
  return createAnonClient();
}

/** One query for camp_id -> live spots-left, instead of one query per camp. */
async function getSpotsLeftMap(supabase: SupabaseClient, campIds: string[], capacityByCamp: Record<string, number>) {
  if (campIds.length === 0) return {} as Record<string, number>;
  const { data, error } = await supabase
    .from('registrations')
    .select('camp_id')
    .in('camp_id', campIds)
    .in('status', ['confirmed', 'payment_submitted']);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.camp_id] = (counts[row.camp_id] ?? 0) + 1;
  }
  const spotsLeft: Record<string, number> = {};
  for (const id of campIds) {
    spotsLeft[id] = Math.max(0, (capacityByCamp[id] ?? 0) - (counts[id] ?? 0));
  }
  return spotsLeft;
}

/** Supabase returns a to-one FK join as an object, but the generic type for
 * a dynamic select string can't express that — normalize defensively. */
function campTypeName(row: CampRow): string {
  const rel = row.camp_types;
  if (!rel) return 'Unknown Camp';
  return Array.isArray(rel) ? rel[0]?.name ?? 'Unknown Camp' : rel.name;
}

function toCamp(row: CampRow, season: SeasonRow, spotsLeft: number): Camp {
  const { accent, iconName } = deriveCampVisuals(row.slug);
  return {
    id: row.id,
    slug: row.slug,
    name: campTypeName(row),
    campTypeId: row.camp_type_id,
    seasonId: row.season_id,
    season: season.type,
    year: season.year,
    dateStart: row.date_start,
    dateEnd: row.date_end,
    ageMin: row.age_min,
    ageMax: row.age_max,
    ageRange: `${row.age_min}–${row.age_max}`,
    dobMin: row.dob_min ?? null,
    dobMax: row.dob_max ?? null,
    capacity: row.capacity,
    spotsLeft,
    displayStatus: getDisplayStatus({ dbStatus: row.status, spotsLeft, capacity: row.capacity }),
    price: row.price_egp,
    description: row.description,
    coverPhotoUrl: row.cover_photo_url,
    dbStatus: row.status,
    accent,
    iconName,
  };
}

/**
 * Strips the real capacity/spotsLeft numbers before a Camp crosses into a
 * Client Component's props — the RSC payload sent to the browser contains
 * every field of a prop object whether or not a component renders it, so
 * "just don't display the number" isn't enough; it has to not be in the
 * object at all. -1 is a visibly-invalid sentinel (never a real count),
 * not just 0, so it can't be misread as "the camp is empty" if a
 * guest-facing component is ever changed to render it directly instead of
 * `displayStatus` — that would be an obvious bug (-1 left), not a subtle
 * information leak.
 */
function redactCapacityForGuest(camp: Camp): Camp {
  return { ...camp, capacity: -1, spotsLeft: -1 };
}

/**
 * Public-facing seasons + camps. RLS (guest policies) already restricts this
 * to open seasons / non-closed camps even if the filters below were dropped,
 * but filtering explicitly keeps intent clear and avoids relying solely on
 * RLS for correctness in this query.
 */
export async function getOpenSeasonsWithCamps(): Promise<Season[]> {
  const supabase = await getAnonClient();

  const { data: seasonRows, error: seasonError } = await supabase
    .from('seasons')
    .select(SEASON_COLUMNS)
    .eq('status', 'open')
    .order('year', { ascending: true });
  if (seasonError) throw seasonError;
  if (!seasonRows || seasonRows.length === 0) return [];

  const seasonIds = seasonRows.map((s) => s.id);
  const { data: campRowsRaw, error: campError } = await supabase
    .from('camps')
    .select(await campColumns())
    .in('season_id', seasonIds)
    .neq('status', 'closed')
    .order('date_start', { ascending: true });
  if (campError) throw campError;
  const campRows = campRowsRaw as unknown as CampRow[] | null;

  const capacityByCamp = Object.fromEntries((campRows ?? []).map((c) => [c.id, c.capacity]));
  const spotsLeftMap = await getSpotsLeftMap(supabase, (campRows ?? []).map((c) => c.id), capacityByCamp);

  const seasonsById = new Map(seasonRows.map((s) => [s.id, s]));
  const campsBySeasonId = new Map<string, Camp[]>();
  for (const row of campRows ?? []) {
    const season = seasonsById.get(row.season_id)!;
    const camp = redactCapacityForGuest(toCamp(row, season, spotsLeftMap[row.id] ?? 0));
    campsBySeasonId.set(row.season_id, [...(campsBySeasonId.get(row.season_id) ?? []), camp]);
  }

  return seasonRows.map((s) => ({
    id: s.id,
    type: s.type,
    label: `${s.type === 'summer' ? 'Summer' : 'Winter'} ${s.year}`,
    year: s.year,
    dbStatus: s.status,
    iconName: deriveSeasonIcon(s.type),
    camps: campsBySeasonId.get(s.id) ?? [],
  }));
}

export async function getOpenCamps(): Promise<Camp[]> {
  const seasons = await getOpenSeasonsWithCamps();
  return seasons.flatMap((s) => s.camps);
}

/** Single camp by slug, for the detail/register pages. Closed camps return null (→ notFound()). */
export async function getCampBySlug(slug: string): Promise<Camp | null> {
  const supabase = await getAnonClient();

  const { data: campRowRaw, error: campError } = await supabase
    .from('camps')
    .select(await campColumns())
    .eq('slug', slug)
    .neq('status', 'closed')
    .maybeSingle();
  if (campError) throw campError;
  const campRow = campRowRaw as unknown as CampRow | null;
  if (!campRow) return null;

  const { data: seasonRow, error: seasonError } = await supabase
    .from('seasons')
    .select(SEASON_COLUMNS)
    .eq('id', campRow.season_id)
    .eq('status', 'open')
    .maybeSingle();
  if (seasonError) throw seasonError;
  if (!seasonRow) return null;

  const spotsLeftMap = await getSpotsLeftMap(supabase, [campRow.id], { [campRow.id]: campRow.capacity });
  return redactCapacityForGuest(toCamp(campRow, seasonRow, spotsLeftMap[campRow.id] ?? 0));
}

/**
 * Full camp/season lists for the portal (admin RLS policy = SELECT all,
 * no status filter) — used by Super Admin's Seasons/Camps tabs and the
 * Admin/Super Admin stat cards. Requires an authenticated staff session;
 * returns empty arrays (not an error) if RLS denies, which is the expected
 * state until Supabase Auth is wired into /portal/login (next step).
 */
export async function getAllSeasonsWithCampsForPortal(): Promise<Season[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: seasonRows, error: seasonError } = await supabase
    .from('seasons')
    .select(SEASON_COLUMNS)
    .order('year', { ascending: true });
  if (seasonError) throw seasonError;
  if (!seasonRows || seasonRows.length === 0) return [];

  const seasonIds = seasonRows.map((s) => s.id);
  const { data: campRowsRaw, error: campError } = await supabase
    .from('camps')
    .select(await campColumns())
    .in('season_id', seasonIds)
    .order('date_start', { ascending: true });
  if (campError) throw campError;
  const campRows = campRowsRaw as unknown as CampRow[] | null;

  const capacityByCamp = Object.fromEntries((campRows ?? []).map((c) => [c.id, c.capacity]));
  const spotsLeftMap = await getSpotsLeftMap(supabase, (campRows ?? []).map((c) => c.id), capacityByCamp);

  const seasonsById = new Map(seasonRows.map((s) => [s.id, s]));
  const campsBySeasonId = new Map<string, Camp[]>();
  for (const row of campRows ?? []) {
    const season = seasonsById.get(row.season_id)!;
    const camp = toCamp(row, season, spotsLeftMap[row.id] ?? 0);
    campsBySeasonId.set(row.season_id, [...(campsBySeasonId.get(row.season_id) ?? []), camp]);
  }

  return seasonRows.map((s) => ({
    id: s.id,
    type: s.type,
    label: `${s.type === 'summer' ? 'Summer' : 'Winter'} ${s.year}`,
    year: s.year,
    dbStatus: s.status,
    iconName: deriveSeasonIcon(s.type),
    camps: campsBySeasonId.get(s.id) ?? [],
  }));
}

export async function getAllCampsForPortal(): Promise<Camp[]> {
  const seasons = await getAllSeasonsWithCampsForPortal();
  return seasons.flatMap((s) => s.camps);
}
