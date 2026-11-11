import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { newColumnsReady } from '@/lib/schema-features';
import { validateCampInput, type CampInput } from '@/lib/validation/camp';

/**
 * camp_type is intentionally locked after creation — it's tied to
 * registrations (camper-facing camp name, capacity assumptions), and
 * letting it change mid-season would silently rewrite what people already
 * registered for. Update payloads may still carry `camp_type_id` (the edit
 * form sends the existing value through unchanged, see CampForm), but it's
 * deliberately excluded from the `update` object below — nothing writes it.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = (await request.json()) as CampInput & { status?: string };

    const errors = validateCampInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const { data: before, error: beforeError } = await supabase
      .from('camps')
      .select('id, slug, age_min, age_max, price_egp, capacity, date_start, date_end, description, cover_photo_url, status, season_id, camp_type_id')
      .eq('id', params.id)
      .maybeSingle();
    if (beforeError) return NextResponse.json({ error: beforeError.message }, { status: 500 });
    if (!before) return NextResponse.json({ error: 'Camp not found' }, { status: 404 });

    // camp_type_id / season_id NOT included — both locked after creation.
    const update: Record<string, unknown> = {
      slug: body.slug.trim(),
      age_min: Number(body.age_min),
      age_max: Number(body.age_max),
      price_egp: Number(body.price_egp),
      capacity: Number(body.capacity),
      date_start: body.date_start,
      date_end: body.date_end,
      description: body.description.trim(),
      cover_photo_url: body.cover_photo_url?.trim() || null,
    };
    const dobMin = body.dob_min?.trim() || null;
    const dobMax = body.dob_max?.trim() || null;
    if (await newColumnsReady()) {
      update.dob_min = dobMin;
      update.dob_max = dobMax;
    } else if (dobMin || dobMax) {
      return NextResponse.json({ error: 'Birth-date limits need a one-time database update first (run supabase/migrations/20260806000001_dob_range_and_bus_pickup.sql in the Supabase SQL editor).' }, { status: 503 });
    }
    if (body.status) update.status = body.status;

    const { data: camp, error } = await supabase
      .from('camps')
      .update(update)
      .eq('id', params.id)
      .select('id, slug, status')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `A camp with the slug "${body.slug}" already exists — choose another.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, userId, 'edit_camp', 'camp', camp.id, { before, after: update });

    return NextResponse.json({ camp });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[camps PATCH]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    // The actual guard: never let a camp with real registration history be
    // deleted. head:true + count:'exact' returns just the count, not the
    // rows — cheap regardless of how many registrations exist.
    const { count, error: countError } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('camp_id', params.id);
    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete this camp — it has ${count} registration${count === 1 ? '' : 's'}. Close or archive it instead of deleting.` },
        { status: 409 }
      );
    }

    const { data: camp, error: fetchError } = await supabase
      .from('camps')
      .select('id, slug, camp_types(name)')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 });

    const { error: deleteError } = await supabase.from('camps').delete().eq('id', params.id);
    if (deleteError) {
      // 23503 = foreign_key_violation. The count-check above already
      // guards the common case; this only fires if a registration was
      // inserted in the narrow window between that check and this delete
      // (registrations.camp_id has no ON DELETE clause, so the DB itself
      // is the final backstop against ever losing registration history).
      if (deleteError.code === '23503') {
        return NextResponse.json({ error: 'Cannot delete this camp — a registration was just created for it. Refresh and try again.' }, { status: 409 });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const typeRel = camp.camp_types as { name: string } | { name: string }[] | null;
    const name = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'Unknown Camp';
    await writeAuditLog(supabase, userId, 'delete_camp', 'camp', camp.id, { name, slug: camp.slug });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[camps DELETE]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
