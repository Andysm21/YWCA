import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { validateNewsInput, type NewsInput } from '@/lib/validation/news';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = (await request.json()) as NewsInput;
    const errors = validateNewsInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const { data: before, error: beforeError } = await supabase
      .from('news_posts')
      .select('id, title, slug, published_at')
      .eq('id', params.id)
      .maybeSingle();
    if (beforeError) return NextResponse.json({ error: beforeError.message }, { status: 500 });
    if (!before) return NextResponse.json({ error: 'News post not found' }, { status: 404 });

    const update = {
      title: body.title.trim(),
      slug: body.slug.trim(),
      content: body.content.trim(),
      cover_image_url: body.cover_image_url?.trim() || null,
      published_at: body.published_at || null,
    };

    const { data: post, error } = await supabase
      .from('news_posts')
      .update(update)
      .eq('id', params.id)
      .select('id, title, slug, published_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `A news post with the slug "${body.slug}" already exists.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, userId, 'edit_news_post', 'news_post', post.id, { before, after: update });

    return NextResponse.json({ post });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[news PATCH]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const { data: post, error: fetchError } = await supabase
      .from('news_posts')
      .select('id, title, slug')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!post) return NextResponse.json({ error: 'News post not found' }, { status: 404 });

    const { error } = await supabase.from('news_posts').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'delete_news_post', 'news_post', post.id, { title: post.title, slug: post.slug });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[news DELETE]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
