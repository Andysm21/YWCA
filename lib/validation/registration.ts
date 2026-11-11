/**
 * Server-side validation for Step 1 registration submissions
 * (app/api/register/route.ts). Mirrors the code-organization pattern of
 * lib/validation/camp.ts and lib/validation/season.ts: run server-side as
 * the actual enforcement boundary, since the client form's own validation
 * can always be bypassed by a direct POST.
 */

export const GRADE_OPTIONS = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'UNI'] as const;
const grades = (from: number, to: number) => GRADE_OPTIONS.filter((g) => g !== 'UNI' && Number(g.slice(6)) >= from && Number(g.slice(6)) <= to);

/** Grades a camper may pick, by camp type name (Kids = up to Grade 6, Teen/Girls/Boys = 7-12, Uni = UNI). */
export function gradeOptionsForCamp(campName: string): readonly string[] {
  const n = campName.toLowerCase();
  if (n.includes('uni')) return ['UNI'];
  if (n.includes('leader')) return [...grades(10, 12), 'UNI'];
  if (n.includes('teen') || n.includes('girls') || n.includes('boys')) return grades(7, 12);
  if (n.includes('kids')) return grades(3, 6);
  return GRADE_OPTIONS;
}

export const KIDS_TSHIRT_SIZES = ['8', '10', '12', '14', '16'] as const;
export const ADULT_TSHIRT_SIZES = ['S', 'M', 'L', 'XL'] as const;

/** Stored value for a kids size is "Kids 8" so it can't be mistaken for anything else in exports. */
export const kidsSizeValue = (n: string) => `Kids ${n}`;

/**
 * T-shirt sizes by camp type: Kids camps use the kids (numeric) sizes;
 * Teen camps can pick from both lists; everything else (Uni, Boys, Girls, Leadership) uses S-XL.
 */
export function tshirtGroupsForCamp(campName: string): { kids: boolean; adult: boolean } {
  const n = campName.toLowerCase();
  if (n.includes('teen')) return { kids: true, adult: true };
  if (n.includes('kids')) return { kids: true, adult: false };
  return { kids: false, adult: true };
}

export function tshirtSizesForCamp(campName: string): string[] {
  const g = tshirtGroupsForCamp(campName);
  return [...(g.kids ? KIDS_TSHIRT_SIZES.map(kidsSizeValue) : []), ...(g.adult ? ADULT_TSHIRT_SIZES : [])];
}

export const BUS_PICKUP_OPTIONS = ['Mohandessin: Mostafa Mahmoud Mosque', 'Tagamo3: In front of Rehab gate 1'] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Broad international phone format: digits, spaces, +, -, parens, 7-15
// digits total. Deliberately not Egypt-only — guardians/emergency
// contacts can be based outside Egypt.
const PHONE_PATTERN = /^[+()\d][\d\s().-]{5,18}\d$/;

const MAX_AGE_YEARS = 100;

export type RegistrationInput = {
  campSlug: string;
  camperName: string;
  dateOfBirth: string;
  mobilePhone: string;
  email: string;
  school: string;
  academicYear: string;
  tshirtSize: string;
  busPickup: string;
  parentName: string;
  parentMobile: string;
  parentEmail: string;
  alternateMobile?: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  medicalCondition?: string;
  additionalInfo?: string;
  [key: string]: unknown;
};

/** Name-like short free-text fields. */
const SHORT_TEXT_FIELDS: Array<{ key: keyof RegistrationInput; label: string }> = [
  { key: 'camperName', label: 'Camper name' },
  { key: 'parentName', label: 'Parent/guardian name' },
  { key: 'school', label: 'School' },
  { key: 'emergencyContactName', label: 'Emergency contact name' },
];
const SHORT_TEXT_MAX = 200;

/** Longer free-text fields. */
const LONG_TEXT_FIELDS: Array<{ key: keyof RegistrationInput; label: string }> = [
  { key: 'medicalCondition', label: 'Medical condition' },
  { key: 'additionalInfo', label: 'Additional info' },
];
const LONG_TEXT_MAX = 2000;

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_PATTERN.test(trimmed)) return false;
  const digitCount = trimmed.replace(/\D/g, '').length;
  return digitCount >= 7 && digitCount <= 15;
}

function isValidDateOfBirth(value: string): boolean {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  if (parsed > now) return false;
  const earliest = new Date();
  earliest.setFullYear(earliest.getFullYear() - MAX_AGE_YEARS);
  if (parsed < earliest) return false;
  return true;
}

/**
 * Validates a Step 1 registration payload beyond simple presence checks:
 * email/phone format, date-of-birth sanity, and maxLength caps on every
 * free-text field. Returns the first error found, or null if valid.
 * Presence/"required field" checks stay in the route (they run first).
 */
export function validateRegistrationInput(body: RegistrationInput): string | null {
  if (!isValidEmail(String(body.email ?? ''))) {
    return 'Please enter a valid camper email address.';
  }
  if (!isValidEmail(String(body.parentEmail ?? ''))) {
    return 'Please enter a valid parent/guardian email address.';
  }

  if (!isValidPhone(String(body.mobilePhone ?? ''))) {
    return 'Please enter a valid camper mobile number.';
  }
  if (!isValidPhone(String(body.parentMobile ?? ''))) {
    return 'Please enter a valid parent/guardian mobile number.';
  }
  if (body.alternateMobile && String(body.alternateMobile).trim() !== '' && !isValidPhone(String(body.alternateMobile))) {
    return 'Please enter a valid alternate mobile number.';
  }
  if (!isValidPhone(String(body.emergencyContactNumber ?? ''))) {
    return 'Please enter a valid emergency contact number.';
  }

  if (!isValidDateOfBirth(String(body.dateOfBirth ?? ''))) {
    return 'Please enter a valid date of birth (not in the future, not more than 100 years ago).';
  }

  for (const { key, label } of SHORT_TEXT_FIELDS) {
    const raw = body[key];
    if (typeof raw === 'string' && raw.trim().length > SHORT_TEXT_MAX) {
      return `${label} must be ${SHORT_TEXT_MAX} characters or fewer.`;
    }
  }
  for (const { key, label } of LONG_TEXT_FIELDS) {
    const raw = body[key];
    if (typeof raw === 'string' && raw.trim().length > LONG_TEXT_MAX) {
      return `${label} must be ${LONG_TEXT_MAX} characters or fewer.`;
    }
  }

  // Other free-text-ish fields not covered above, still capped defensively.
  const otherCapped: Array<{ key: keyof RegistrationInput; label: string; max: number }> = [
    { key: 'campSlug', label: 'Camp', max: SHORT_TEXT_MAX },
    { key: 'academicYear', label: 'Academic year', max: SHORT_TEXT_MAX },
    { key: 'tshirtSize', label: 'T-shirt size', max: SHORT_TEXT_MAX },
    { key: 'mobilePhone', label: 'Camper mobile', max: SHORT_TEXT_MAX },
    { key: 'parentMobile', label: 'Parent mobile', max: SHORT_TEXT_MAX },
    { key: 'alternateMobile', label: 'Alternate mobile', max: SHORT_TEXT_MAX },
    { key: 'emergencyContactNumber', label: 'Emergency contact number', max: SHORT_TEXT_MAX },
    { key: 'email', label: 'Camper email', max: SHORT_TEXT_MAX },
    { key: 'parentEmail', label: 'Parent email', max: SHORT_TEXT_MAX },
  ];
  for (const { key, label, max } of otherCapped) {
    const raw = body[key];
    if (typeof raw === 'string' && raw.trim().length > max) {
      return `${label} must be ${max} characters or fewer.`;
    }
  }

  if (!(GRADE_OPTIONS as readonly string[]).includes(String(body.academicYear).trim())) {
    return 'Please choose a valid grade.';
  }
  // (T-shirt size is validated per camp type in the API route.)
  if (!(BUS_PICKUP_OPTIONS as readonly string[]).includes(String(body.busPickup).trim())) {
    return 'Please choose a bus pickup point.';
  }

  return null;
}
