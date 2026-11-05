import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { createServiceClient } from '@/utils/supabase/service';
import { GALLERY_BUCKET } from '@/lib/gallery-storage';

// Vercel serverless request bodies cap at ~4.5MB; the client downsizes
// photos before uploading, this is the hard server-side ceiling.
const MAX_BYTES = 4 * 1024 * 1024;

function sniffImageType(buf: Uint8Array): { ext: string; contentType: string } | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', contentType: 'image/jpeg' };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { ext: 'png', contentType: 'image/png' };
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return { ext: 'webp', contentType: 'image/webp' };
  return null;
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image is too large (max 4 MB).' }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) {
      return NextResponse.json({ error: 'Only JPG, PNG or WebP images are allowed.' }, { status: 400 });
    }

    const text = (key: string) => {
      const v = form.get(key);
      return typeof v === 'string' ? v.trim() : '';
    };
    const caption = text('caption').slice(0, 200);
    const campId = text('camp_id') || null;
    const seasonId = text('season_id') || null;

    const service = createServiceClient();
    const path = `${new Date().getUTCFullYear()}/${randomUUID()}.${type.ext}`;
    const { error: uploadError } = await service.storage
      .from(GALLERY_BUCKET)
      .upload(path, bytes, { contentType: type.contentType, cacheControl: '31536000' });
    if (uploadError) {
      console.error('[gallery upload] storage', uploadError);
      return NextResponse.json({ error: 'Could not store the image. Please try again.' }, { status: 500 });
    }

    const { data: { publicUrl } } = service.storage.from(GALLERY_BUCKET).getPublicUrl(path);

    const { data: image, error } = await supabase
      .from('gallery_images')
      .insert({ image_url: publicUrl, caption: caption || null, camp_id: campId, season_id: seasonId, uploaded_by: userId })
      .select('id, image_url, caption')
      .single();

    if (error) {
      await service.storage.from(GALLERY_BUCKET).remove([path]);
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Selected camp or season does not exist.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, userId, 'add_gallery_image', 'gallery_image', image.id, { image_url: image.image_url });
    return NextResponse.json({ image });
  } catch (err) {
    console.error('[gallery upload]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected server error' }, { status: 500 });
  }
}
