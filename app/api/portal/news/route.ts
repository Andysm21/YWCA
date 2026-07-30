import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { validateNewsInput, type NewsInput } from '@/lib/validation/news';

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = (await request.json()) as NewsInput;
    const errors = validateNewsInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const { data: post, error } = await supabase
      .from('news_posts')
      .insert({
        title: body.title.trim(),
        slug: body.slug.trim(),
        content: body.content.trim(),
        cover_image_url: body.cover_image_url?.trim() || null,
        published_at: body.published_at || null,
        created_by: userId,
      })
      .select('id, title, slug, published_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `A news post with the slug "${body.slug}" already exists.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, userId, 'create_news_post', 'news_post', post.id, { title: post.title, slug: post.slug });

    return NextResponse.json({ post });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[news POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
