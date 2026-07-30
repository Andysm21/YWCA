import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';

const VALID_STATUSES = ['draft', 'open', 'closed'];

/** Status toggle (Open/Closed/Draft) — the only season field editable after creation for now. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = await request.json();
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Status must be draft, open, or closed.' }, { status: 400 });
    }

    const { data: before, error: beforeError } = await supabase
      .from('seasons')
      .select('id, year, type, status')
      .eq('id', params.id)
      .maybeSingle();
    if (beforeError) return NextResponse.json({ error: beforeError.message }, { status: 500 });
    if (!before) return NextResponse.json({ error: 'Season not found' }, { status: 404 });

    const { data: season, error } = await supabase
      .from('seasons')
      .update({ status: body.status })
      .eq('id', params.id)
      .select('id, year, type, status')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'update_season_status', 'season', season.id, { before: before.status, after: season.status });

    return NextResponse.json({ season });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[seasons PATCH]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
