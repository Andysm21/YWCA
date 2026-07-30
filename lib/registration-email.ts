import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SendResult } from '@/lib/email';
import { createServiceClient } from '@/utils/supabase/service';

/**
 * Writes a SendResult (from any of the lib/email.ts senders) onto
 * registrations.email_status / email_failure_reason, AND appends a row to
 * email_send_log — the registration column only ever holds the latest
 * outcome (overwritten on resend), while email_send_log is the full send
 * history, which both the "Today's Email Usage" dashboard widget and the
 * quota-retry queue need. Shared by the initial registration route, the
 * waitlist-promotion path, the "filled up during Step 2" waitlist branch,
 * and the "Resend email" action, so all four record delivery the same way.
 *
 * The registrations UPDATE uses the CALLER's client (service-role for
 * guest routes, cookie-authenticated for staff routes — RLS already
 * permits both to write email_status). The email_send_log INSERT always
 * uses a fresh service-role client regardless, since that table has no
 * `authenticated` write policy at all (staff can read, never write
 * directly — see the migration's comment).
 */
export async function recordEmailResult(supabase: SupabaseClient, registrationId: string, result: SendResult) {
  const { error } = await supabase
    .from('registrations')
    .update({
      email_status: result.status,
      email_failure_reason: result.status === 'failed' ? result.reason : null,
    })
    .eq('id', registrationId);
  if (error) {
    // Never let an email-status bookkeeping failure surface as a request
    // failure — the actual send already happened (or didn't); this just
    // couldn't be recorded. Logged for visibility.
    console.error('[recordEmailResult] failed to update email_status', error);
  }

  const logClient = createServiceClient();
  const { error: logError } = await logClient.from('email_send_log').insert({
    status: result.status,
    failure_type: result.status === 'failed' ? result.failureType : null,
    failure_reason: result.status === 'failed' ? result.reason : null,
    registration_id: registrationId,
  });
  if (logError) {
    console.error('[recordEmailResult] failed to write email_send_log', logError);
  }
}
