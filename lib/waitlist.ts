import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/utils/supabase/service';
import { getHeldSpots } from '@/lib/queries/held-spots';
import { sendWaitlistEmail } from '@/lib/email';
import { recordEmailResult } from '@/lib/registration-email';

/**
 * Re-number a camp's waitlist by REGISTRATION TIME (oldest registration = #1),
 * no matter when each person was moved onto the list. This keeps promotion
 * order fair: whoever registered first is first in line.
 */
export async function resequenceWaitlist(supabase: SupabaseClient, campId: string): Promise<void> {
  const { data, error } = await supabase
    .from('registrations')
    .select('id, waitlist_position')
    .eq('camp_id', campId)
    .eq('status', 'waitlisted')
    .order('created_at', { ascending: true });
  if (error || !data) return;
  for (let i = 0; i < data.length; i++) {
    if (data[i].waitlist_position !== i + 1) {
      await supabase.from('registrations').update({ waitlist_position: i + 1 }).eq('id', data[i].id);
    }
  }
}

/**
 * Moves a registration to the waitlist: status 'waitlisted' (only if it is still a plain
 * pending-payment registration), then fixes the order by registration time.
 * Returns the final waitlist position, or null if nothing changed (someone else already moved it).
 */
export async function moveToWaitlist(supabase: SupabaseClient, registrationId: string, campId: string): Promise<number | null> {
  const { count } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('camp_id', campId)
    .eq('status', 'waitlisted');
  const { data: updated, error } = await supabase
    .from('registrations')
    .update({ status: 'waitlisted', waitlist_position: (count ?? 0) + 1 })
    .eq('id', registrationId)
    .eq('status', 'pending_payment')
    .is('promoted_from_waitlist_at', null)
    .select('id');
  if (error || !updated || updated.length === 0) return null;
  await resequenceWaitlist(supabase, campId);
  const { data: fresh } = await supabase.from('registrations').select('waitlist_position').eq('id', registrationId).maybeSingle();
  return fresh?.waitlist_position ?? null;
}

/**
 * Called when a pending-payment registration opens its payment link: if the camp is already
 * full (confirmed + awaiting confirmation + promoted still paying), the registration becomes a
 * waitlist registration right away and gets the waitlist email, so they never pay for a spot that
 * no longer exists. Promoted registrations keep their held spot and are never moved.
 * Returns true when it was moved.
 */
export async function autoWaitlistIfFull(registrationNumber: string, campSlug: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data: reg } = await supabase
    .from('registrations')
    .select('id, status, camp_id, camper_name, parent_email, registration_number, promoted_from_waitlist_at, camps(slug, capacity, camp_types(name))')
    .eq('registration_number', registrationNumber.trim())
    .maybeSingle();
  if (!reg || reg.status !== 'pending_payment' || reg.promoted_from_waitlist_at) return false;

  const campRel = (reg as any).camps;
  const camp = Array.isArray(campRel) ? campRel[0] : campRel;
  if (!camp || camp.slug !== campSlug) return false;
  if ((await getHeldSpots(reg.camp_id, reg.id)) < camp.capacity) return false;

  const position = await moveToWaitlist(supabase, reg.id, reg.camp_id);
  if (position === null) return false;

  try {
    const typeRel = camp.camp_types;
    const result = await sendWaitlistEmail({
      to: reg.parent_email,
      camperName: reg.camper_name,
      registrationNumber: reg.registration_number,
      campName: (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'the camp',
      waitlistPosition: position,
    });
    await recordEmailResult(supabase, reg.id, result);
  } catch (err) {
    console.error('[autoWaitlistIfFull] email failed', err);
  }
  return true;
}

/**
 * When a camp is full (confirmed + awaiting confirmation + promoted still paying >= capacity),
 * every plain pending-payment registration that hasn't paid becomes a waitlist registration,
 * in registration-time order (first to register = waitlist #1), and gets the waitlist email.
 * Safe to call repeatedly: it only touches pending-payment, non-promoted registrations.
 * Returns how many were moved.
 */
export async function syncFullCampWaitlist(campId: string): Promise<number> {
  try {
    const supabase = createServiceClient();
    const { data: camp } = await supabase
      .from('camps')
      .select('capacity, camp_types(name)')
      .eq('id', campId)
      .maybeSingle();
    if (!camp || !(camp.capacity > 0)) return 0;
    if ((await getHeldSpots(campId)) < camp.capacity) return 0;

    const { data: pending } = await supabase
      .from('registrations')
      .select('id, camper_name, parent_email, registration_number')
      .eq('camp_id', campId)
      .eq('status', 'pending_payment')
      .is('promoted_from_waitlist_at', null)
      .order('created_at', { ascending: true });
    if (!pending || pending.length === 0) return 0;

    const typeRel = (camp as any).camp_types;
    const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'the camp';
    let moved = 0;
    for (const reg of pending) {
      const position = await moveToWaitlist(supabase, reg.id, campId);
      if (position === null) continue;
      moved += 1;
      try {
        const result = await sendWaitlistEmail({
          to: reg.parent_email,
          camperName: reg.camper_name,
          registrationNumber: reg.registration_number,
          campName,
          waitlistPosition: position,
        });
        await recordEmailResult(supabase, reg.id, result);
      } catch (err) {
        console.error('[syncFullCampWaitlist] email failed', err);
      }
    }
    return moved;
  } catch (err) {
    console.error('[syncFullCampWaitlist]', err);
    return 0;
  }
}
