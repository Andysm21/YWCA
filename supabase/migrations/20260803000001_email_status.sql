/*
# Registration email delivery tracking

## Summary
Tracks whether the confirmation/waitlist/promotion email for a registration
actually went out, so staff can spot bad addresses (nodemailer's rejected
recipients / SMTP errors) and follow up manually instead of a registration
silently having no email ever delivered.

## Columns added to `registrations`
- `email_status` (enum: pending | sent | failed) — defaults to 'pending' so
  existing rows (created before this migration) read as "not yet tracked"
  rather than falsely "sent".
- `email_failure_reason` (text, nullable) — populated from nodemailer's
  error/rejected-recipients output when email_status = 'failed'.

No RLS changes needed — these are plain columns on a table whose RLS is
already correct (super_admin full, admin update via the existing
`staff_update_registrations` policy + `enforce_admin_registration_update`
trigger, which only blocks admin from touching camper/guardian identity
fields — these two new columns aren't in that blocklist, so admin can
already update them, needed for the "Resend email" action).
*/

CREATE TYPE registration_email_status AS ENUM ('pending', 'sent', 'failed');

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS email_status registration_email_status NOT NULL DEFAULT 'pending';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS email_failure_reason text;
