import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireStaff, requireSuperAdmin } from '@/lib/auth/require-staff';
import { createServiceClient } from '@/utils/supabase/service';
import { writeAuditLog } from '@/lib/audit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Correct a wrong email on a registration (guardian and/or camper). Staff only.
 * Admins are blocked from editing camper/guardian fields by a database trigger,
 * so the write goes through the service role AFTER the staff check here —
 * deliberately limited to the two email fields. Every change is audit-logged.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = (await request.json()) as { parent_email?: string; email?: string };
    const update: Record<string, string> = {};
    if (typeof body.parent_email === 'string') update.parent_email = body.parent_email.trim().toLowerCase();
    if (typeof body.email === 'string') update.email = body.email.trim().toLowerCase();
    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });
    for (const [k, v] of Object.entries(update)) {
      if (!EMAIL_RE.test(v)) return NextResponse.json({ error: `${k === 'parent_email' ? 'Guardian' : 'Camper'} email is not a valid address.` }, { status: 400 });
    }

    const { data: before, error: fetchError } = await supabase
      .from('registrations')
      .select('id, parent_email, email')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!before) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    // New address -> the previous delivery result no longer applies.
    const { data: updated, error } = await createServiceClient()
      .from('registrations')
      .update({ ...update, email_status: 'pending', email_failure_reason: null })
      .eq('id', params.id)
      .select('id, parent_email, email')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'edit_registration_email', 'registration', params.id, {
      before: { parent_email: before.parent_email, email: before.email },
      after: { parent_email: updated.parent_email, email: updated.email },
    });
    revalidatePath('/portal', 'layout');
    return NextResponse.json({ registration: updated });
  } catch (err) {
    console.error('[registration PATCH]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected server error' }, { status: 500 });
  }
}

/**
 * Permanently remove a wrong/duplicate registration. Super Admin only.
 * Uploaded documents' database rows go with it (cascade); the files stay in
 * Google Drive. If it was confirmed, the spot is freed automatically.
 */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const { data: reg, error: fetchError } = await supabase
      .from('registrations')
      .select('id, registration_number, camper_name, parent_email, status, camp_id')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const { error } = await supabase.from('registrations').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'delete_registration', 'registration', params.id, {
      registration_number: reg.registration_number,
      camper_name: reg.camper_name,
      parent_email: reg.parent_email,
      status: reg.status,
      camp_id: reg.camp_id,
    });
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, campId: reg.camp_id });
  } catch (err) {
    console.error('[registration DELETE]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected server error' }, { status: 500 });
  }
}
