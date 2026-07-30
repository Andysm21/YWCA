/*
# Email send log

## Summary
Every email send ATTEMPT (confirmation, waitlist, promotion, resend) gets a
row here, in addition to the existing registrations.email_status column.
registrations.email_status only holds the LATEST outcome for that
registration (overwritten on resend); this table is the full history,
needed for (a) "Today's Email Usage" counting on the Super Admin
dashboard and (b) the quota-retry queue finding every quota-failed send,
not just the most recent one per registration.

## Access
No guest access at all — inserted only by server code (service-role),
readable only by staff (is_admin()). Not exposed via any guest-facing
route.
*/

CREATE TYPE email_send_status AS ENUM ('sent', 'failed');
CREATE TYPE email_failure_type AS ENUM ('quota_exceeded', 'invalid_address', 'other');

CREATE TABLE IF NOT EXISTS email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamptz NOT NULL DEFAULT now(),
  status email_send_status NOT NULL,
  failure_type email_failure_type,
  failure_reason text,
  registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  retried_at timestamptz,
  retry_succeeded boolean,
  CHECK (status = 'failed' OR failure_type IS NULL)
);

CREATE INDEX IF NOT EXISTS email_send_log_sent_at_idx ON email_send_log (sent_at);
CREATE INDEX IF NOT EXISTS email_send_log_failure_type_idx ON email_send_log (failure_type) WHERE failure_type IS NOT NULL;

ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_email_send_log" ON email_send_log;
CREATE POLICY "admin_select_email_send_log"
ON email_send_log FOR SELECT
TO authenticated
USING (public.is_admin());

-- No INSERT/UPDATE policy for `authenticated` — every write goes through
-- the service-role client (lib/registration-email.ts, the retry route),
-- which bypasses RLS entirely. Staff can read, never write directly.
