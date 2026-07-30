import 'server-only';

/**
 * `.invalid` is reserved by RFC 2606 specifically for addresses that must
 * never resolve or receive real mail — exactly the property needed here,
 * since Supabase Auth requires an email per account but username-based
 * accounts have no real one. Not a domain we own; that's fine precisely
 * because nothing is ever supposed to be delivered to it.
 */
const SYNTHETIC_EMAIL_DOMAIN = 'staff.internal.invalid';

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;
export const MIN_PASSWORD_LENGTH = 8;

/** Lowercased so username lookups/uniqueness are case-insensitive without a citext extension. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** The ONLY place a synthetic login email is constructed — every caller (account creation, login lookup) must go through this so the two can never drift apart. */
export function syntheticEmailForUsername(username: string): string {
  return `${normalizeUsername(username)}@${SYNTHETIC_EMAIL_DOMAIN}`;
}
