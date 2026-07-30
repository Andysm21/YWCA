import 'server-only';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

export type GalleryImageRow = {
  id: string;
  image_url: string;
  caption: string | null;
  camp_id: string | null;
  season_id: string | null;
  uploaded_at: string;
};

const COLUMNS = 'id, image_url, caption, camp_id, season_id, uploaded_at';

export async function getGalleryImagesPage({ page = 1, pageSize = 24 }: { page?: number; pageSize?: number }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('gallery_images')
    .select(COLUMNS, { count: 'exact' })
    .order('uploaded_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  return { rows: (data ?? []) as GalleryImageRow[], count: count ?? 0, page, pageSize };
}
