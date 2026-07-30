/*
# Gallery images table

## RLS (per schema doc)
Guest: SELECT published only — gallery has no draft/publish flag in the
schema doc, so all rows are treated as public (SELECT all for anon).
Admin: full. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id uuid REFERENCES camps(id) ON DELETE SET NULL,
  season_id uuid REFERENCES seasons(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  caption text,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_camp_id ON gallery_images(camp_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_season_id ON gallery_images(season_id);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_select_gallery_images" ON gallery_images;
CREATE POLICY "guest_select_gallery_images"
ON gallery_images FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "staff_full_gallery_images" ON gallery_images;
CREATE POLICY "staff_full_gallery_images"
ON gallery_images FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
