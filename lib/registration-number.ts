import 'server-only';
import { randomInt } from 'node:crypto';

// No 0/O/1/I/L so a number read out over the phone is never ambiguous.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Random, NON-sequential registration number, e.g. YC26-K7M2QX.
 * The old numbers (YC260001, YC260002...) counted registrations in order,
 * which let anyone who registered see how many people had registered.
 * Uniqueness is guaranteed by the database's UNIQUE constraint; callers retry on a collision.
 */
export function generateRegistrationNumber(now = new Date()): string {
  const yy = String(now.getFullYear() % 100).padStart(2, '0');
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `YC${yy}-${code}`;
}
