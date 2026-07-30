import 'server-only';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

export type CampTypeRow = {
  id: string;
  name: string;
  applicable_season_type: 'summer' | 'winter' | 'both';
  sort_order: number;
};

const COLUMNS = 'id, name, applicable_season_type, sort_order';

/** The fixed camp-type catalog, for the Add Camp dropdown. Small, fully-read table — no pagination needed. */
export async function getCampTypes(): Promise<CampTypeRow[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data, error } = await supabase
    .from('camp_types')
    .select(COLUMNS)
    .order('sort_order', { ascending: true });
  if (error) throw error;

  return data ?? [];
}
