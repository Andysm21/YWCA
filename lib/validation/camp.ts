export type CampInput = {
  season_id: string;
  /** Required on create; ignored on edit (camp_type is locked after creation — see app/api/portal/camps/[id]/route.ts). */
  camp_type_id: string;
  slug: string;
  age_min: number | string;
  age_max: number | string;
  price_egp: number | string;
  capacity: number | string;
  date_start: string;
  date_end: string;
  description: string;
  cover_photo_url?: string | null;
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Mirrors the DB CHECK constraints on `camps` exactly (see migration
 * 000004): CHECK (age_min <= age_max), CHECK (date_start <= date_end),
 * CHECK (capacity > 0) — plus a few sanity checks the DB doesn't enforce
 * (slug format, season/camp-type selected). The `slug` UNIQUE constraint
 * and the (season_id, camp_type_id) UNIQUE constraint can't be checked
 * here (no DB access) — the API route catches the resulting Postgres
 * unique_violation (23505) separately.
 *
 * Run both client-side (instant feedback) and server-side (the actual
 * enforcement — the client-side pass is a UX nicety, not a security
 * boundary; a modified/bypassed client still hits this same function
 * server-side before anything touches the DB).
 *
 * `camp_type_id` is only meaningfully validated on create — the edit form
 * carries the existing (locked) value through unchanged, so this check
 * passes harmlessly there too rather than needing a second validator.
 */
export function validateCampInput(input: CampInput): string[] {
  const errors: string[] = [];

  const ageMin = typeof input.age_min === 'string' ? parseInt(input.age_min, 10) : input.age_min;
  const ageMax = typeof input.age_max === 'string' ? parseInt(input.age_max, 10) : input.age_max;
  const price = typeof input.price_egp === 'string' ? parseFloat(input.price_egp) : input.price_egp;
  const capacity = typeof input.capacity === 'string' ? parseInt(input.capacity, 10) : input.capacity;

  if (!input.season_id) errors.push('A season must be selected.');
  if (!input.camp_type_id) errors.push('A camp type must be selected.');

  if (!input.slug.trim()) {
    errors.push('Slug is required.');
  } else if (!SLUG_PATTERN.test(input.slug.trim())) {
    errors.push('Slug must be lowercase letters, numbers, and hyphens only (e.g. "kids-camp-1").');
  }

  if (!Number.isInteger(ageMin) || ageMin < 0) errors.push('Minimum age must be a non-negative whole number.');
  if (!Number.isInteger(ageMax) || ageMax < 0) errors.push('Maximum age must be a non-negative whole number.');
  // Mirrors DB CHECK (age_min <= age_max) — only meaningful once both are valid numbers.
  if (Number.isInteger(ageMin) && Number.isInteger(ageMax) && ageMin > ageMax) {
    errors.push('Minimum age cannot be greater than maximum age.');
  }

  if (!Number.isFinite(price) || price < 0) errors.push('Price must be a non-negative number.');

  // Mirrors DB CHECK (capacity > 0).
  if (!Number.isInteger(capacity) || capacity <= 0) errors.push('Capacity must be a whole number greater than 0.');

  if (!input.date_start) errors.push('Start date is required.');
  if (!input.date_end) errors.push('End date is required.');
  // Mirrors DB CHECK (date_start <= date_end) — only meaningful once both are present and parse.
  if (input.date_start && input.date_end) {
    const start = new Date(input.date_start);
    const end = new Date(input.date_end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      errors.push('Dates must be valid.');
    } else if (start > end) {
      errors.push('Start date cannot be after end date.');
    }
  }

  if (!input.description.trim()) errors.push('Description is required.');

  return errors;
}
