import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireStaff, requireSuperAdmin } from '@/lib/auth/require-staff';
import { createServiceClient } from '@/utils/supabase/service';
import { writeAuditLog } from '@/lib/audit';
import { newColumnsReady } from '@/lib/schema-features';
import {
  BUS_PICKUP_OPTIONS, gradeOptionsForCamp, tshirtSizesForCamp, isValidEmail, isValidPhone,
} from '@/lib/validation/registration';

const SHORT_MAX = 200;
const LONG_MAX = 2000;

type Edits = Record<string, unknown>;

const REQUIRED_TEXT: Record<string, string> = {
  camper_name: 'Camper name',
  parent_name: 'Guardian name',
  school: 'School',
  emergency_contact_name: 'Emergency contact name',
};
const REQUIRED_PHONE: Record<string, string> = {
  mobile_phone: 'Camper mobile',
  parent_mobile: 'Guardian mobile',
  emergency_contact_number: 'Emergency contact number',
};
const EMAIL_FIELDS: Record<string, string> = { email: 'Camper email', parent_email: 'Guardian email' };
const OPTIONAL_LONG = ['medical_condition', 'additional_info'];

/**
 * Correct any wrong data a parent entered on a registration. Staff only
 * (admin + super admin). Admins are blocked from editing camper/guardian
 * fields by a database trigger, so the write goes through the service role
 * AFTER the staff check here, limited to the whitelist below. Camp, status and
 * registration number are NOT editable. Every change is audit-logged with a
 * before/after diff. Only the fields that are sent are validated and changed.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  try {
    const body = (await request.json()) as Edits;

    const { data: before, error: fetchError } = await supabase
      .from('registrations')
      .select('*, camps(camp_types(name))')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!before) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const campRel = (before as any).camps;
    const camp = Array.isArray(campRel) ? campRel[0] : campRel;
    const typeRel = camp?.camp_types;
    const campName: string = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? '';

    const update: Edits = {};
    const str = (k: string) => String(body[k] ?? '').trim();

    for (const [k, label] of Object.entries(REQUIRED_TEXT)) {
      if (!(k in body)) continue;
      const v = str(k);
      if (!v) return NextResponse.json({ error: `${label} is required.` }, { status: 400 });
      if (v.length > SHORT_MAX) return NextResponse.json({ error: `${label} is too long.` }, { status: 400 });
      update[k] = v;
    }
    for (const [k, label] of Object.entries(REQUIRED_PHONE)) {
      if (!(k in body)) continue;
      const v = str(k);
      if (!isValidPhone(v)) return NextResponse.json({ error: `${label} is not a valid phone number.` }, { status: 400 });
      update[k] = v;
    }
    if ('alternate_mobile' in body) {
      const v = str('alternate_mobile');
      if (v && !isValidPhone(v)) return NextResponse.json({ error: 'Alternate mobile is not a valid phone number.' }, { status: 400 });
      update.alternate_mobile = v || null;
    }
    for (const [k, label] of Object.entries(EMAIL_FIELDS)) {
      if (!(k in body)) continue;
      const v = str(k).toLowerCase();
      if (!isValidEmail(v)) return NextResponse.json({ error: `${label} is not a valid email address.` }, { status: 400 });
      update[k] = v;
    }
    for (const k of OPTIONAL_LONG) {
      if (!(k in body)) continue;
      const v = str(k);
      if (v.length > LONG_MAX) return NextResponse.json({ error: `${k === 'medical_condition' ? 'Medical conditions' : 'Additional info'} is too long.` }, { status: 400 });
      update[k] = v || null;
    }
    if ('date_of_birth' in body) {
      const v = str('date_of_birth').slice(0, 10);
      const d = new Date(v);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(d.getTime()) || d > new Date()) {
        return NextResponse.json({ error: 'Birth date is not valid.' }, { status: 400 });
      }
      update.date_of_birth = v;
    }
    if ('academic_year' in body) {
      const v = str('academic_year');
      if (!gradeOptionsForCamp(campName).includes(v)) return NextResponse.json({ error: `"${v}" is not a grade option for ${campName || 'this camp'}.` }, { status: 400 });
      update.academic_year = v;
    }
    if ('tshirt_size' in body) {
      const v = str('tshirt_size');
      if (!tshirtSizesForCamp(campName).includes(v)) return NextResponse.json({ error: `"${v}" is not a T-shirt size option for ${campName || 'this camp'}.` }, { status: 400 });
      update.tshirt_size = v;
    }
    if ('bus_pickup' in body) {
      if (!(await newColumnsReady())) return NextResponse.json({ error: 'Bus pickup is not available until the database update has been run.' }, { status: 503 });
      const v = str('bus_pickup');
      if (!(BUS_PICKUP_OPTIONS as readonly string[]).includes(v)) return NextResponse.json({ error: 'Choose a valid bus pickup point.' }, { status: 400 });
      update.bus_pickup = v;
    }
    if ('first_time_camper' in body) update.first_time_camper = body.first_time_camper === true;

    // Only keep what actually changed.
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const [k, v] of Object.entries(update)) {
      const old = (before as any)[k] ?? null;
      if (old !== (v ?? null)) changes[k] = { from: old, to: v };
    }
    if (Object.keys(changes).length === 0) return NextResponse.json({ changed: [], emailChanged: false });

    const patch: Edits = Object.fromEntries(Object.entries(changes).map(([k, c]) => [k, c.to]));
    const emailChanged = 'parent_email' in changes || 'email' in changes;
    // A new email address means the previous delivery result no longer applies.
    if (emailChanged) {
      patch.email_status = 'pending';
      patch.email_failure_reason = null;
    }

    const { error } = await createServiceClient().from('registrations').update(patch).eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, userId, 'edit_registration', 'registration', params.id, { changes });
    revalidatePath('/portal', 'layout');
    return NextResponse.json({ changed: Object.keys(changes), emailChanged });
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
