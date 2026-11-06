import {
  Shirt,
  Droplets,
  Backpack,
  Users,
  Sun,
  Trophy,
  Tent,
  Waves,
  Mountain,
  Star,
  Award,
} from 'lucide-react';

// DB-backed status (matches the `camp_status` / `season_status` Postgres enums).
export type CampDbStatus = 'coming_soon' | 'open' | 'closed';
export type SeasonDbStatus = 'draft' | 'open' | 'closed';
export type Accent = 'orange' | 'teal' | 'gold';

// Icon NAMES, not components — Camp/Season objects are constructed
// server-side (lib/queries/camps.ts) and passed as props into Client
// Components. React Server Components cannot serialize a function (a
// LucideIcon component reference) across that boundary — it happened to
// not throw on the very first SSR render, but any subsequent
// router.refresh() (which re-fetches the RSC payload over the wire, where
// this is strictly enforced) throws "Functions cannot be passed directly
// to Client Components". Resolve the string back to a component via
// lib/icon-map.ts, client-side, where it's just a local lookup, not a
// value crossing the server/client boundary.
export type CampIconName = 'sparkles' | 'users' | 'heart-handshake' | 'compass' | 'sun' | 'waves' | 'mountain' | 'star';
export type SeasonIconName = 'sun' | 'snowflake';

export type Camp = {
  id: string;
  slug: string;
  name: string;
  campTypeId: string;
  seasonId: string;
  season: 'summer' | 'winter';
  year: number;
  dateStart: string;
  dateEnd: string;
  ageMin: number;
  ageMax: number;
  ageRange: string;
  /**
   * capacity/spotsLeft carry the real numbers everywhere internally, but
   * guest-facing query exports (lib/queries/camps.ts: getOpenCamps,
   * getCampBySlug, getOpenSeasonsWithCamps) redact both to -1 before this
   * object is ever passed into a Client Component — guests only ever see
   * `displayStatus` (Open/Filling Fast/Waitlist/Closed), never a raw
   * number. Portal queries (getAllCampsForPortal) keep the real values.
   * Don't render capacity/spotsLeft directly in guest-facing components;
   * use displayStatus instead, or the redaction is pointless.
   */
  capacity: number;
  spotsLeft: number;
  /** Precomputed via getDisplayStatus — always safe to expose, even on the redacted guest-facing shape above. */
  displayStatus: DisplayStatus;
  price: number;
  description: string;
  coverPhotoUrl: string | null;
  dbStatus: CampDbStatus;
  /** Cosmetic only — derived from slug, not stored in the DB. */
  accent: Accent;
  iconName: CampIconName;
};

export type Season = {
  id: string;
  type: 'summer' | 'winter';
  label: string;
  year: number;
  dbStatus: SeasonDbStatus;
  iconName: SeasonIconName;
  camps: Camp[];
};

const ACCENTS: Accent[] = ['orange', 'teal', 'gold'];
const CAMP_ICON_NAMES: CampIconName[] = ['sparkles', 'users', 'heart-handshake', 'compass', 'sun', 'waves', 'mountain', 'star'];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic cosmetic accent/icon from a camp's slug — no DB column for this. */
export function deriveCampVisuals(slug: string): { accent: Accent; iconName: CampIconName } {
  const h = hashString(slug);
  return { accent: ACCENTS[h % ACCENTS.length], iconName: CAMP_ICON_NAMES[h % CAMP_ICON_NAMES.length] };
}

export function deriveSeasonIcon(type: 'summer' | 'winter'): SeasonIconName {
  return type === 'summer' ? 'sun' : 'snowflake';
}

/**
 * Display status combines the DB's coarse status with the live spots-left
 * count (computed from real registration counts, not stored) to reproduce
 * the old open/filling/waitlist/closed/coming-soon labels.
 */
export type DisplayStatus = 'open' | 'filling' | 'waitlist' | 'closed' | 'coming-soon';

export function getDisplayStatus(camp: Pick<Camp, 'dbStatus' | 'spotsLeft' | 'capacity'>): DisplayStatus {
  if (camp.dbStatus === 'closed') return 'closed';
  if (camp.dbStatus === 'coming_soon') return 'coming-soon';
  if (camp.spotsLeft <= 0) return 'waitlist';
  if (camp.spotsLeft / camp.capacity <= 0.2) return 'filling';
  return 'open';
}

export function getStatusLabel(status: DisplayStatus): string {
  switch (status) {
    case 'open': return 'Open';
    case 'filling': return 'Almost Full';
    case 'waitlist': return 'Waitlist';
    case 'closed': return 'Closed';
    case 'coming-soon': return 'Coming Soon';
  }
}

export const faqItems = [
  { question: 'Where is the camp located?', answer: 'YWCA Camp is held in Ras Sedr, a coastal town on the Gulf of Suez in South Sinai, Egypt. The site features beach access, desert landscapes, and open-air activity areas — a perfect outdoor setting for a camping experience.' },
  { question: 'What ages can attend camp?', answer: 'We offer camps for ages 7–24. Kids Camps serve ages 7–11, Girls and Boys Camps serve ages 12–16, Uni Camp serves ages 18–24, and Leadership Camp serves ages 16–22. Check each camp\'s page for specific age requirements.' },
  { question: 'How long is each camp session?', answer: 'Each camp runs for 7 days and 6 nights, from Sunday to Sunday. Check-in is on the first day in the early afternoon, and departure is on the final day after the closing ceremony.' },
  { question: 'What is included in the camp fee?', answer: 'The fee covers all meals, accommodation, activities, equipment, a camp t-shirt, and supervision by our volunteer leader team. Transportation to and from Ras Sedr is not included, but we provide a recommended bus service from Cairo for an additional fee.' },
  { question: 'Who are the camp leaders?', answer: 'Our leaders are a diverse volunteer team of former campers. They range from experienced older leaders with over a decade of camp experience to newer younger leaders stepping into their first counseling role. All leaders complete our Leadership Camp training program.' },
  { question: 'What should my child pack?', answer: 'We provide a detailed packing list for each camp. Essentials include swimwear, sun protection, comfortable clothing, a reusable water bottle, and a sleeping bag. Visit our Packing List page for the complete checklist.' },
  { question: 'Is the camp safe?', answer: 'Safety is our top priority. We maintain a leader-to-camper ratio of at least 1:6, have a first-aid station on site, and all water activities are supervised by certified lifeguards. We also have emergency protocols and nearby medical facilities.' },
  { question: 'Can my child attend more than one camp?', answer: 'Absolutely! Many campers attend multiple sessions per season. Each camp has a slightly different program, and returning campers often take on mentor roles. You will need to register separately for each camp.' },
  { question: 'What is the refund policy?', answer: 'Full refunds are available up to 30 days before the camp start date. Between 30 and 14 days, a 50% refund is available. Within 14 days, the fee is non-refundable. In case of medical emergencies, we review refund requests on a case-by-case basis.' },
  { question: 'How do I register my child?', answer: 'Visit our Register page, choose the camp session, and complete the two-step registration form. Step 1 collects camper information, and Step 2 collects guardian and payment details. You will receive a confirmation email after completing registration.' },
];

export const packingCategories = [
  {
    category: 'Clothing items',
    icon: Shirt,
    items: [
      '14 t-shirts',
      '10 shorts',
      '1 pair of pants',
      '7-10 underwear',
      'Bathing suits',
      '7 pairs of socks',
      'A pair of sneakers',
      'A pair of slippers',
      'Pajamas',
      'A shower towel',
      'A beach towel',
      'A cap',
      'A light jacket',
    ],
  },
  {
    category: 'Toiletries',
    icon: Droplets,
    items: [
      'Shampoo & Conditioner',
      'Soap/Shower gel',
      'Hairbrush/Comb',
      'Deodorant',
      'Sunscreen',
      'Toothbrush & paste',
      'Toilet paper',
      'Tissue paper',
      'Wipes',
      'Insect Repellant',
    ],
  },
  {
    category: 'Others',
    icon: Backpack,
    items: [
      'Refillable Water Bottle',
    ],
  },
];

export const historyTimeline = [
  { year: '2008', title: 'The First Camp', description: 'YWCA Camp was founded with a single summer session for 30 kids on the Ras Sedr coast. The vision: character-building through outdoor adventure.' },
  { year: '2012', title: 'Winter Season Added', description: 'Due to growing demand, a Winter season was introduced with Kids Camp and Teen Camp, taking advantage of Egypt\'s mild winter weather.' },
  { year: '2015', title: 'Leadership Camp Launches', description: 'The capstone Leadership Camp was created to train the next generation of counselors — former campers returning as volunteer leaders.' },
  { year: '2018', title: 'Eight Summer Camps', description: 'The summer program expanded to eight sessions, adding Girls Camp, Uni Camp, and a fourth Kids Camp to serve more age groups.' },
  { year: '2022', title: 'Sustainability Initiative', description: 'Camp committed to a healthy, sustainable, simplistic lifestyle — solar power, local food sourcing, and a waste-reduction program.' },
  { year: '2026', title: 'Today', description: 'YWCA Camp now serves over 600 campers per year across two seasons, with a volunteer team of 32 former campers. The mission remains the same: character, teamwork, and leadership through immersive outdoor experiences.' },
];

export function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth();
  const sFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const eFmt = new Intl.DateTimeFormat('en-US', { month: sameMonth ? undefined : 'short', day: 'numeric' });
  return `${sFmt.format(s)} – ${eFmt.format(e)}, ${e.getFullYear()}`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US').format(price);
}
