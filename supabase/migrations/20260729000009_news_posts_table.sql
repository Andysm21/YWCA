/*
# News posts table

## RLS (per schema doc)
Guest: SELECT published only (published_at IS NOT NULL and not in the
future). Admin: full. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  cover_image_url text,
  published_at timestamptz,
  created_by uuid REFERENCES users(id)
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_select_published_news" ON news_posts;
CREATE POLICY "guest_select_published_news"
ON news_posts FOR SELECT
TO anon
USING (published_at IS NOT NULL AND published_at <= now());

DROP POLICY IF EXISTS "staff_full_news" ON news_posts;
CREATE POLICY "staff_full_news"
ON news_posts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
