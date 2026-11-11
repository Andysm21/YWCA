import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { newColumnsReady } from '@/lib/schema-features';
import { validateCampInput, type CampInput } from '@/lib/validation/camp';

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = (await request.json()) as CampInput;

    const errors = validateCampInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    // Server-side re-check that the chosen camp type is actually applicable
    // to the chosen season's type — the dropdown already filters this
    // client-side, but that's UX only, not enforcement.
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('id, type')
      .eq('id', body.season_id)
      .maybeSingle();
    if (seasonError) return NextResponse.json({ error: seasonError.message }, { status: 500 });
    if (!season) return NextResponse.json({ error: 'Selected season does not exist.' }, { status: 400 });

    const { data: campType, error: campTypeError } = await supabase
      .from('camp_types')
      .select('id, name, applicable_season_type')
      .eq('id', body.camp_type_id)
      .maybeSingle();
    if (campTypeError) return NextResponse.json({ error: campTypeError.message }, { status: 500 });
    if (!campType) return NextResponse.json({ error: 'Selected camp type does not exist.' }, { status: 400 });
    if (campType.applicable_season_type !== 'both' && campType.applicable_season_type !== season.type) {
      return NextResponse.json(
        { error: `"${campType.name}" is not a ${season.type} camp type.` },
        { status: 400 }
      );
    }

    const dobMin = body.dob_min?.trim() || null;
    const dobMax = body.dob_max?.trim() || null;
    if ((dobMin || dobMax) && !(await newColumnsReady())) {
      return NextResponse.json({ error: 'Birth-date limits need a one-time database update first (run supabase/migrations/20260806000001_dob_range_and_bus_pickup.sql in the Supabase SQL editor).' }, { status: 503 });
    }

    const { data: camp, error } = await supabase
      .from('camps')
      .insert({
        ...(dobMin || dobMax ? { dob_min: dobMin, dob_max: dobMax } : {}),
        season_id: body.season_id,
        camp_type_id: body.camp_type_id,
        slug: body.slug.trim(),
        age_min: Number(body.age_min),
        age_max: Number(body.age_max),
        price_egp: Number(body.price_egp),
        capacity: Number(body.capacity),
        date_start: body.date_start,
        date_end: body.date_end,
        description: body.description.trim(),
        cover_photo_url: body.cover_photo_url?.trim() || null,
        status: 'coming_soon',
        created_by: userId,
      })
      .select('id, slug')
      .single();

    if (error) {
      // 23505 = unique_violation — either the `slug` unique constraint, or
      // the (season_id, camp_type_id) constraint (same type added twice to
      // one season). Postgres's error detail distinguishes which.
      if (error.code === '23505') {
        if (error.message.includes('camps_season_camp_type_unique')) {
          return NextResponse.json({ error: `"${campType.name}" has already been added to this season.` }, { status: 409 });
        }
        return NextResponse.json({ error: `A camp with the slug "${body.slug}" already exists — choose another.` }, { status: 409 });
      }
      // 23503 = foreign_key_violation — season_id/camp_type_id didn't match a real row.
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Selected season or camp type does not exist.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, userId, 'create_camp', 'camp', camp.id, { name: campType.name, slug: camp.slug });

    return NextResponse.json({ camp });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[camps POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
