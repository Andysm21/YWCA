import 'server-only';
import { createServiceClient } from '@/utils/supabase/service';
import type { RegistrationStatus } from '@/lib/queries/registrations';

export type GuestRegistrationStatus = {
  registrationNumber: string;
  status: RegistrationStatus;
  waitlistPosition: number | null;
  camperName: string;
  campName: string;
  campSlug: string;
};

/**
 * Guest-facing registration lookup by registration number, scoped to a
 * specific camp slug — same narrowing rationale as the name+mobile lookup
 * in app/api/register/lookup/route.ts (a registration number alone
 * shouldn't be enough to pull up someone else's record if it's ever
 * guessed/leaked, so the camp it belongs to must also match). Uses the
 * service-role client because `registrations` has no anon SELECT policy
 * (by design — the registration/payment flow is service-role-mediated,
 * not RLS-mediated, since guests never authenticate).
 *
 * Returns null on no match — callers should fall back to showing the
 * normal form/lookup UI, not an error, since an unrecognized code is a
 * completely expected case (typo, wrong camp, not yet submitted).
 */
export async function getRegistrationStatusByCode(campSlug: string, registrationNumber: string): Promise<GuestRegistrationStatus | null> {
  if (!campSlug || !registrationNumber) return null;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('registration_number, status, waitlist_position, camper_name, camps(slug, camp_types(name))')
    .eq('registration_number', registrationNumber.trim())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const campRel = data.camps as { slug: string; camp_types: { name: string } | { name: string }[] | null } | { slug: string; camp_types: { name: string } | { name: string }[] | null }[] | null;
  const camp = Array.isArray(campRel) ? campRel[0] : campRel;
  // Camp-scoping is enforced here in JS, not via a PostgREST embedded-table
  // filter — a registration number belongs to exactly one camp, and this
  // guards against a code for a different camp being replayed on this
  // page (e.g. copy-pasted into the wrong URL).
  if (!camp || camp.slug !== campSlug) return null;
  const typeRel = camp.camp_types;
  const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'Unknown Camp';

  return {
    registrationNumber: data.registration_number,
    status: data.status,
    waitlistPosition: data.waitlist_position,
    camperName: data.camper_name,
    campName,
    campSlug: camp.slug,
  };
}
