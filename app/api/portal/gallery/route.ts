import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = await request.json();
    const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';
    const caption = typeof body.caption === 'string' ? body.caption.trim() : '';
    const campId = typeof body.camp_id === 'string' && body.camp_id ? body.camp_id : null;
    const seasonId = typeof body.season_id === 'string' && body.season_id ? body.season_id : null;

    if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
      return NextResponse.json({ error: 'A valid image URL (http/https) is required.' }, { status: 400 });
    }

    const { data: image, error } = await supabase
      .from('gallery_images')
      .insert({
        image_url: imageUrl,
        caption: caption || null,
        camp_id: campId,
        season_id: seasonId,
        uploaded_by: userId,
      })
      .select('id, image_url, caption')
      .single();

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Selected camp or season does not exist.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, userId, 'add_gallery_image', 'gallery_image', image.id, { image_url: image.image_url });

    return NextResponse.json({ image });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[gallery POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
