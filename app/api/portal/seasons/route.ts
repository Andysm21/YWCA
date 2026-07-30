import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { validateSeasonInput } from '@/lib/validation/season';

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = await request.json();
    const errors = validateSeasonInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const year = Number(body.year);

    const { data: season, error } = await supabase
      .from('seasons')
      .insert({ year, type: body.type, status: 'draft', created_by: userId })
      .select('id, year, type, status')
      .single();

    if (error) {
      // 23505 = unique_violation on the (year, type) constraint.
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `A ${body.type} season for ${year} already exists.` },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, userId, 'create_season', 'season', season.id, { year: season.year, type: season.type });

    return NextResponse.json({ season });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[seasons POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
