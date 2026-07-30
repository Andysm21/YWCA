export type SeasonInput = {
  year: number;
  type: 'summer' | 'winter';
};

/**
 * Mirrors the DB constraints on `seasons` (see migration 000003):
 * year is a plain int, type is the season_type enum, and (year, type) has
 * a UNIQUE constraint enforced at the DB layer — this function can't check
 * uniqueness itself (no DB access), the API route catches the resulting
 * Postgres unique_violation (23505) separately. This is purely the
 * "is this input well-formed" layer, run both client-side (instant
 * feedback) and server-side (the actual enforcement — never trust the
 * client-side pass alone).
 */
export function validateSeasonInput(input: { year: number | string; type: string }): string[] {
  const errors: string[] = [];
  const year = typeof input.year === 'string' ? parseInt(input.year, 10) : input.year;

  if (!Number.isInteger(year)) {
    errors.push('Year must be a whole number.');
  } else if (year < 2020 || year > 2100) {
    errors.push('Year must be between 2020 and 2100.');
  }

  if (input.type !== 'summer' && input.type !== 'winter') {
    errors.push('Season type must be summer or winter.');
  }

  return errors;
}
