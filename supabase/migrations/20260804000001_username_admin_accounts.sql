/*
# Username/password Admin accounts (second creation path)

## Summary
Super Admin can now create an Admin two ways: the existing email-invite
flow (unchanged), or directly with a username + password (no invite/accept
step, account is active immediately). Username-based accounts authenticate
against a synthetic internal email under a `.invalid` TLD (RFC 2606 —
guaranteed to never resolve or receive real mail), since Supabase Auth
requires an email on every account. `recovery_email` is a real address used
ONLY for the custom password-reset flow below — never for login.

## username / recovery_email columns
`username` is nullable and unique — null for invited (email-based) accounts,
set only for directly-created ones. Stored lowercased so lookups at login
are case-insensitive without needing a citext extension.

## password_reset_tokens
Only relevant to username-based accounts (their auth email can't receive
Supabase's built-in reset email). No RLS policies at all — same
deny-all-by-default pattern as `registration_number_counters`: every access
goes through the service-role client from the forgot-password/reset-password
API routes, never through a user session.
*/. 

ALTER TABLE users ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_email text;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON password_reset_tokens(token);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies — deny-all. Service-role client bypasses RLS.
