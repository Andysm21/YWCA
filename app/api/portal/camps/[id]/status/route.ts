import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth/require-staff';
import { writeAuditLog } from '@/lib/audit';
import { scheduleReady } from '@/lib/schema-features';
import { resolveRegistrationState, type RegistrationState } from '@/lib/validation/camp';

/** Super Admin: open / hide / schedule a camp without touching its other details. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = (await request.json()) as { state?: RegistrationState; opens_at_local?: string };
    if (!body.state || !['hidden', 'scheduled', 'coming_soon', 'open'].includes(body.state)) {
      return NextResponse.json({ error: 'Invalid state.' }, { status: 400 });
    }
    const state = resolveRegistrationState({ registration_state: body.state, opens_at_local: body.opens_at_local });
    if (!state.ok) return NextResponse.json({ error: state.error }, { status: 400 });

    const ready = await scheduleReady();
    if (state.opens_at && !ready) {
      return NextResponse.json({ error: 'Scheduling needs a one-time database update first (run supabase/migrations/20260815000001_camp_scheduled_opening.sql in the Supabase SQL editor).' }, { status: 503 });
    }

    const update: Record<string, unknown> = { status: state.status };
    if (ready) update.opens_at = state.opens_at;
    const { data: camp, error } = await supabase.from('camps').update(update).eq('id', params.id).select('id, status').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 });

    await writeAuditLog(supabase, userId, 'set_camp_state', 'camp', camp.id, { state: body.state, status: state.status, opens_at: state.opens_at });
    revalidatePath('/', 'layout');
    return NextResponse.json({ camp });
  } catch (err) {
    console.error('[camps status PATCH]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected server error' }, { status: 500 });
  }
}
