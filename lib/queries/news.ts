import 'server-only';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

export type NewsPostRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
};

const COLUMNS = 'id, title, slug, content, cover_image_url, published_at';

export async function getNewsPostsPage({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('news_posts')
    .select(COLUMNS, { count: 'exact' })
    .order('published_at', { ascending: false, nullsFirst: true })
    .range(from, to);
  if (error) throw error;

  return { rows: (data ?? []) as NewsPostRow[], count: count ?? 0, page, pageSize };
}
