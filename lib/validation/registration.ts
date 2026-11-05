/**
 * Server-side validation for Step 1 registration submissions
 * (app/api/register/route.ts). Mirrors the code-organization pattern of
 * lib/validation/camp.ts and lib/validation/season.ts: run server-side as
 * the actual enforcement boundary, since the client form's own validation
 * can always be bypassed by a direct POST.
 */

export const GRADE_OPTIONS = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'UNI'] as const;
export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

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
  if (!(TSHIRT_SIZES as readonly string[]).includes(String(body.tshirtSize).trim())) {
    return 'Please choose a valid T-shirt size.';
  }

  return null;
}
