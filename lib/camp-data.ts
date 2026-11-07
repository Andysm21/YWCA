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

export const faqItems: { question: string; answer: string; link?: { href: string; label: string } }[] = [
  { question: 'What is The Camp?', answer: 'A fun-filled, character-building experience. We live a simple lifestyle, using simple tools creatively for plenty of fun. Team-based activities teach acceptance of others and teamwork, and every camp has a theme that is presented and emphasized throughout The Camp.' },
  { question: 'Where is the camp located?', answer: 'The Camp is at Paradise, Ras Sudr, a closed and secure compound 30 minutes away from the city. It has 13 huts, a sitting room, a dining room, a pool, a sand playing field and a grass playing field. The Camp has been at this campsite since 2019.' },
  { question: 'What ages can attend camp?', answer: 'Each camp is for a specific age group. Check each camp\'s page for its age range.' },
  { question: 'When do the camps run?', answer: 'The dates of every camp are on its page and on the calendar.', link: { href: '/calendar', label: 'View the calendar' } },
  { question: 'What is included in the camp fee?', answer: 'The fee covers meals, accommodation, activities, equipment, a camp t-shirt, and supervision by our volunteer leader team. Transportation to and from the camp is also included. If a particular camp requires any extra fees, we will contact the parents directly.' },
  { question: 'Who are the camp leaders?', answer: 'We are a diverse group of former campers who volunteer to direct and lead The Camp.' },
  { question: 'Where are the meeting points?', answer: 'At 7 a.m. in Mohandessin: Mostafa Mahmoud Mosque. At 8 a.m. in Tagamo3: in front of Gate 1 - Rehab.' },
  { question: 'Which ID do campers need?', answer: 'Campers below 15 years need to submit an Egyptian form of ID, either a birth certificate or a passport. If it is not available, please inform your camp director. Campers 15 years and above must have their Egyptian IDs with them.' },
  { question: 'What should my child pack?', answer: 'We provide a complete packing list covering clothing, toiletries and other essentials. You can view it online or download it as a PDF.', link: { href: '/packing', label: 'View the packing list' } },
  { question: 'Is there a canteen?', answer: 'Yes. The canteen offers snacks once a day, with an average budget of 500 EGP.' },
  { question: 'What does a day at camp look like?', answer: 'A day starts with waking up and morning sports at 8:00 AM, and includes breakfast, hut cleaning, songs and devotion, games, lunch and rest, crafts, dinner, and a night game at 9:00 PM. See the full schedule on our About page.', link: { href: '/about#a-day-at-camp', label: 'See a day at camp' } },
  { question: 'Can parents visit or call?', answer: 'Parents cannot visit, and parents cannot call campers directly. Parents\' calls are accepted daily in a specific time set by the director. Two leaders are responsible for taking these calls.' },
  { question: 'What about medical attention and emergencies?', answer: 'We always have leaders who are doctors or pharmacists in the camp and/or on call, and we have a well-stocked pharmacy and first-aid kit. For minor issues (low fever, mild diarrhea, etc.) we inform and consult parents and then administer medication. In case of emergencies, there is a hospital nearby. We always inform parents of any medical emergencies.' },
  { question: 'How do I register my child?', answer: 'Visit our Register page and choose the camp session. First read the camp rules and agree to them, then read the registration instructions and fill in the camper and guardian details. After you submit the form, you will receive an email with a payment link. Your registration is only complete, and your spot secured, once you pay the full amount through that link and upload a screenshot as proof of payment. Our team then confirms your spot by email. If these steps are not completed, the registration stays pending and a spot is not guaranteed.' },
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

// Source: "The Camp - Parents Info Session - Summer 2026" (slides 3, 6, 7).
export const historyTimeline = [
  { year: '1940s', title: 'Camps begin', description: 'YWCA camps started around the 1940s.' },
  { year: '1950s', title: 'El-Mandara, Alexandria', description: 'Camps have been held in El-Mandara, Alexandria since the 1950s.' },
  { year: '2019', title: 'New campsite', description: 'The Camp moved to its new campsite: Paradise, Ras Sudr.' },
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
