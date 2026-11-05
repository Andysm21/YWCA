/*
# Public storage bucket for gallery photos

Photos are uploaded server-side (service role) by staff via
/api/portal/gallery/upload; the bucket is public so guests can load them.
No storage.objects policies are added — anon/authenticated cannot write
directly; only the service role can.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 4194304, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;
