import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const { data: image, error: fetchError } = await supabase
      .from('gallery_images')
      .select('id, image_url')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    const { error } = await supabase.from('gallery_images').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'delete_gallery_image', 'gallery_image', image.id, { image_url: image.image_url });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[gallery DELETE]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
