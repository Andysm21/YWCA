import 'server-only';
import { createServiceClient } from '@/utils/supabase/service';

/**
 * `site_settings` has no guest RLS policy at all (Guest: none — see
 * migration 000008), but the payment page needs to show bank details to
 * unauthenticated guests. Using the service-role client here specifically
 * (bypasses RLS) rather than adding a guest SELECT policy to the whole
 * table — narrowed to exactly the two keys this page needs, not a
 * general-purpose settings read.
 */
/**
 * `iban` is stored (and returned) WITH spaces — that's the single source
 * of truth, used as-is for on-screen display. The IBAN copy button strips
 * whitespace client-side at copy-time (components/sections/payment-
 * content.tsx) rather than a second no-spaces value being stored here, so
 * there's one canonical value to keep in sync if the bank details change.
 * `instructions` is the free-text context block from the original Google
 * Form ("You can make a deposit or transfer to..."), shown above the
 * beneficiary/IBAN fields on the payment page.
 */
export async function getBankDetails(): Promise<{ iban: string | null; beneficiary: string | null; instructions: string | null }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['bank_iban', 'bank_beneficiary', 'bank_instructions']);
  if (error) throw error;

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]));
  const iban = byKey.get('bank_iban');
  const beneficiary = byKey.get('bank_beneficiary');
  const instructions = byKey.get('bank_instructions');
  return {
    iban: typeof iban === 'string' ? iban : null,
    beneficiary: typeof beneficiary === 'string' ? beneficiary : null,
    instructions: typeof instructions === 'string' ? instructions : null,
  };
}

/**
 * Meeting-point bullet items for the confirmation email. Not currently
 * editable anywhere in the UI (the Super Admin Settings tab is still a
 * static stub, unwired to `site_settings` — flagging that rather than
 * silently building settings persistence as part of this task).
 * `value` is jsonb — accepts either a JSON array of strings (the intended
 * shape once the Settings tab is wired up) or a single newline-separated
 * string (in case it's ever hand-entered directly in the DB). Returns an
 * empty array if the key was never set; the email template renders nothing
 * for this section in that case rather than an empty bullet.
 */
export async function getMeetingPoints(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'meeting_points')
    .maybeSingle();
  if (error) throw error;

  const value = data?.value;
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  }
  if (typeof value === 'string') {
    return value.split('\n').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}
