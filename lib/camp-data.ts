import {
  Users,
  HeartHandshake,
  Compass,
  Sparkles,
  Sun,
  Snowflake,
  Trophy,
  Tent,
  Waves,
  Mountain,
  Star,
  Award,
  type LucideIcon,
} from 'lucide-react';

export type CampStatus = 'open' | 'filling' | 'waitlist' | 'closed' | 'coming-soon';

export type Camp = {
  id: string;
  slug: string;
  name: string;
  season: 'summer' | 'winter';
  year: number;
  startDate: string;
  endDate: string;
  ageRange: string;
  ageMin: number;
  ageMax: number;
  capacity: number;
  spotsLeft: number;
  price: number;
  blurb: string;
  description: string;
  highlights: string[];
  itinerary: { day: string; title: string; description: string }[];
  accent: 'orange' | 'teal' | 'gold';
  icon: LucideIcon;
  status: CampStatus;
};

export type Season = {
  id: 'summer' | 'winter';
  label: string;
  year: number;
  tagline: string;
  icon: LucideIcon;
  open: boolean;
  camps: Camp[];
};

export const seasons: Season[] = [
  {
    id: 'summer',
    label: 'Summer 2026',
    year: 2026,
    tagline: 'Eight camps. One unforgettable Red Sea summer.',
    icon: Sun,
    open: true,
    camps: [
      {
        id: 'kids-1',
        slug: 'kids-camp-1',
        name: 'Kids Camp 1',
        season: 'summer',
        year: 2026,
        startDate: '2026-06-14',
        endDate: '2026-06-21',
        ageRange: '7–11',
        ageMin: 7,
        ageMax: 11,
        capacity: 80,
        spotsLeft: 12,
        price: 6500,
        blurb: 'The classic first-camp adventure — beach games, teamwork challenges and campfire nights.',
        description:
          'Kids Camp 1 kicks off the summer season with the perfect first camping experience. Campers spend seven days on the Ras Sedr coast, rotating through team-based beach games, creative workshops, and character-building challenges. Evenings bring campfire circles, storytelling, and stargazing on the Red Sea shore.',
        highlights: [
          'Beach Olympics & team relay races',
          'Creative arts & nature workshops',
          'Campfire storytelling nights',
          'Intro to leadership & teamwork',
          'Red Sea snorkeling basics',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Welcome', description: 'Check-in, team assignments, ice-breaker games, and the opening campfire.' },
          { day: 'Day 2', title: 'Beach Olympics', description: 'A full day of team-based beach games — relay races, sandcastle contests, and tug-of-war.' },
          { day: 'Day 3', title: 'Nature & Crafts', description: 'Morning nature walk, afternoon creative workshops using natural materials.' },
          { day: 'Day 4', title: 'Team Challenge Day', description: 'Multi-station obstacle course designed around teamwork and communication.' },
          { day: 'Day 5', title: 'Red Sea Day', description: 'Snorkeling basics, swimming, and a beach BBQ at sunset.' },
          { day: 'Day 6', title: 'Leadership Lab', description: 'Campers lead their own teams through a series of character-building challenges.' },
          { day: 'Day 7', title: 'Closing Ceremony', description: 'Awards, reflections, and a final campfire before departure.' },
        ],
        accent: 'orange',
        icon: Sparkles,
        status: 'filling',
      },
      {
        id: 'kids-2',
        slug: 'kids-camp-2',
        name: 'Kids Camp 2',
        season: 'summer',
        year: 2026,
        startDate: '2026-06-24',
        endDate: '2026-07-01',
        ageRange: '7–11',
        ageMin: 7,
        ageMax: 11,
        capacity: 80,
        spotsLeft: 34,
        price: 6500,
        blurb: 'A second run of the Kids Camp magic for new and returning campers alike.',
        description:
          'Kids Camp 2 offers the same beloved format as Camp 1, with fresh activities and new friendships. Returning campers take on mentor roles while first-timers discover the joy of camp life on the Red Sea coast.',
        highlights: [
          'New team challenges & games',
          'Mentor roles for returning campers',
          'Desert nature exploration',
          'Evening talent shows',
          'Water sports & beach games',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Ice Breakers', description: 'Welcome, team formation, and getting-to-know-you games on the beach.' },
          { day: 'Day 2', title: 'Desert Discovery', description: 'Guided desert walk, learning about local flora and fauna, and a picnic lunch.' },
          { day: 'Day 3', title: 'Water Sports Day', description: 'Kayaking, swimming races, and beach volleyball tournaments.' },
          { day: 'Day 4', title: 'Creative Arts', description: 'Workshops in painting, music, and drama — culminating in an evening talent show.' },
          { day: 'Day 5', title: 'Great Team Challenge', description: 'The signature multi-team challenge course spanning land and sea.' },
          { day: 'Day 6', title: 'Mentor Day', description: 'Returning campers lead activities for newer campers, building leadership skills.' },
          { day: 'Day 7', title: 'Farewell Campfire', description: 'Sharing circle, certificates, and a final night under the stars.' },
        ],
        accent: 'teal',
        icon: Users,
        status: 'open',
      },
      {
        id: 'kids-3',
        slug: 'kids-camp-3',
        name: 'Kids Camp 3',
        season: 'summer',
        year: 2026,
        startDate: '2026-07-05',
        endDate: '2026-07-12',
        ageRange: '7–11',
        ageMin: 7,
        ageMax: 11,
        capacity: 80,
        spotsLeft: 0,
        price: 6500,
        blurb: 'Our most popular session — fills fast every year. Join the waitlist to grab a spot.',
        description:
          'Kids Camp 3 is the most sought-after session of the summer. With the season in full swing, the energy is unmatched. Join the waitlist — spots open up every year as plans change.',
        highlights: [
          'Peak-season beach fun',
          'Advanced team challenges',
          'Stargazing & astronomy night',
          'Friendship-building focus',
          'End-of-camp celebration',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Team Sort', description: 'Welcome and team assignments with a beachfront opening ceremony.' },
          { day: 'Day 2', title: 'Peak Beach Olympics', description: 'The biggest beach games event of the season — full tournament format.' },
          { day: 'Day 3', title: 'Astronomy Night', description: 'Daytime nature crafts, evening stargazing with telescopes on the beach.' },
          { day: 'Day 4', title: 'Challenge Course', description: 'The full obstacle and teamwork course — the campers\' favorite day.' },
          { day: 'Day 5', title: 'Red Sea Adventure', description: 'Snorkeling, swimming, and a sunset beach BBQ.' },
          { day: 'Day 6', title: 'Friendship Day', description: 'Activities focused on building lasting friendships and trust.' },
          { day: 'Day 7', title: 'Grand Celebration', description: 'Awards ceremony, group photos, and a celebratory final campfire.' },
        ],
        accent: 'gold',
        icon: Sparkles,
        status: 'waitlist',
      },
      {
        id: 'kids-4',
        slug: 'kids-camp-4',
        name: 'Kids Camp 4',
        season: 'summer',
        year: 2026,
        startDate: '2026-07-15',
        endDate: '2026-07-22',
        ageRange: '7–11',
        ageMin: 7,
        ageMax: 11,
        capacity: 80,
        spotsLeft: 28,
        price: 6500,
        blurb: 'A late-summer Kids Camp with calmer seas and golden desert evenings.',
        description:
          'Kids Camp 4 offers a mellower vibe as the summer heat begins to ease. Calmer seas make for ideal swimming conditions, and golden desert evenings are perfect for outdoor activities and storytelling.',
        highlights: [
          'Calmer Red Sea swimming',
          'Golden-hour desert activities',
          'Outdoor survival basics',
          'Campfire cooking workshops',
          'Team sports tournaments',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Orientation', description: 'Check-in, camp tour, and welcome games as the sun sets over the desert.' },
          { day: 'Day 2', title: 'Swimming & Water Games', description: 'Taking advantage of calm seas — swimming lessons and water relays.' },
          { day: 'Day 3', title: 'Desert Survival', description: 'Learning basic outdoor skills — shelter building, navigation, and safety.' },
          { day: 'Day 4', title: 'Campfire Cooking', description: 'Workshops on outdoor cooking, ending with a communal dinner.' },
          { day: 'Day 5', title: 'Team Sports Day', description: 'Soccer, volleyball, and team-based field games.' },
          { day: 'Day 6', title: 'Creative Expression', description: 'Art, music, and drama workshops with an evening showcase.' },
          { day: 'Day 7', title: 'Closing Circle', description: 'Reflection, awards, and farewells around the final campfire.' },
        ],
        accent: 'orange',
        icon: Sun,
        status: 'open',
      },
      {
        id: 'girls-camp',
        slug: 'girls-camp',
        name: 'Girls Camp',
        season: 'summer',
        year: 2026,
        startDate: '2026-07-25',
        endDate: '2026-08-01',
        ageRange: '12–16',
        ageMin: 12,
        ageMax: 16,
        capacity: 60,
        spotsLeft: 9,
        price: 7200,
        blurb: 'A dedicated space for young women to lead, climb, swim and grow together.',
        description:
          'Girls Camp creates a supportive, empowering environment where young women build confidence, leadership skills, and lasting friendships. The program combines physical challenges — climbing, swimming, hiking — with workshops on self-expression, teamwork, and community.',
        highlights: [
          'Women-led leadership workshops',
          'Rock climbing & adventure sports',
          'Self-expression & confidence building',
          'Mentorship circles',
          'Beach & water sports',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Sisterhood', description: 'Welcome circle, team formation, and intention-setting for the week.' },
          { day: 'Day 2', title: 'Adventure Sports', description: 'Rock climbing basics, hiking, and an outdoor challenge course.' },
          { day: 'Day 3', title: 'Leadership Workshop', description: 'Women-led sessions on communication, decision-making, and leading teams.' },
          { day: 'Day 4', title: 'Water & Beach Day', description: 'Swimming, kayaking, and beach games with a sunset reflection circle.' },
          { day: 'Day 5', title: 'Self-Expression Day', description: 'Creative workshops in art, writing, and performance — sharing stories.' },
          { day: 'Day 6', title: 'Mentorship Circles', description: 'Small-group mentorship with experienced female leaders and alumni.' },
          { day: 'Day 7', title: 'Empowerment Ceremony', description: 'Celebrating growth, sharing reflections, and a closing campfire.' },
        ],
        accent: 'teal',
        icon: HeartHandshake,
        status: 'filling',
      },
      {
        id: 'uni-camp',
        slug: 'uni-camp',
        name: 'Uni Camp',
        season: 'summer',
        year: 2026,
        startDate: '2026-08-04',
        endDate: '2026-08-11',
        ageRange: '18–24',
        ageMin: 18,
        ageMax: 24,
        capacity: 50,
        spotsLeft: 22,
        price: 7800,
        blurb: 'University-aged campers tackle advanced leadership challenges and deep conversations.',
        description:
          'Uni Camp is designed for university students and young adults. The program goes beyond games — campers engage in advanced leadership challenges, meaningful discussions about values and society, and real-world team problem-solving scenarios.',
        highlights: [
          'Advanced leadership challenges',
          'Values & ethics discussion groups',
          'Real-world problem-solving scenarios',
          'Networking with peers & alumni',
          'Outdoor adventure sports',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Framework', description: 'Welcome, team formation, and an overview of the leadership framework.' },
          { day: 'Day 2', title: 'Leadership Challenge', description: 'Complex team challenges that test communication, strategy, and execution.' },
          { day: 'Day 3', title: 'Values & Ethics Forum', description: 'Facilitated discussions on character, integrity, and leading with purpose.' },
          { day: 'Day 4', title: 'Adventure Day', description: 'Hiking, climbing, and outdoor survival skills in the desert landscape.' },
          { day: 'Day 5', title: 'Problem-Solving Lab', description: 'Real-world scenario challenges — teams design solutions under pressure.' },
          { day: 'Day 6', title: 'Alumni Networking', description: 'Meet former campers who are now leaders in their fields. Share stories.' },
          { day: 'Day 7', title: 'Commitment & Closing', description: 'Personal commitment circles, reflections, and a final celebration.' },
        ],
        accent: 'gold',
        icon: Compass,
        status: 'open',
      },
      {
        id: 'boys-camp',
        slug: 'boys-camp',
        name: 'Boys Camp',
        season: 'summer',
        year: 2026,
        startDate: '2026-08-14',
        endDate: '2026-08-21',
        ageRange: '12–16',
        ageMin: 12,
        ageMax: 16,
        capacity: 60,
        spotsLeft: 17,
        price: 7200,
        blurb: 'High-energy team sports, desert treks and character built under the sun.',
        description:
          'Boys Camp channels energy into positive team experiences. High-intensity sports, desert adventures, and structured character-building activities help young men develop discipline, respect, and leadership skills.',
        highlights: [
          'Team sports tournaments',
          'Desert trekking & navigation',
          'Discipline & character workshops',
          'Strength & conditioning',
          'Team strategy games',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Team Draft', description: 'Welcome, team selection, and an opening physical challenge.' },
          { day: 'Day 2', title: 'Sports Tournament', description: 'Soccer, volleyball, and relay tournaments — round robin format.' },
          { day: 'Day 3', title: 'Desert Trek', description: 'Guided desert hike with navigation challenges and team objectives.' },
          { day: 'Day 4', title: 'Character Workshop', description: 'Sessions on respect, discipline, and what it means to lead.' },
          { day: 'Day 5', title: 'Water Sports Day', description: 'Swimming, beach wrestling, and water-based team games.' },
          { day: 'Day 6', title: 'Strategy Games', description: 'Complex team strategy challenges — capture the flag, scenario games.' },
          { day: 'Day 7', title: 'Awards & Closing', description: 'Recognizing growth and teamwork, final campfire, and farewells.' },
        ],
        accent: 'orange',
        icon: Users,
        status: 'open',
      },
      {
        id: 'leadership-camp',
        slug: 'leadership-camp',
        name: 'Leadership Camp',
        season: 'summer',
        year: 2026,
        startDate: '2026-08-24',
        endDate: '2026-09-01',
        ageRange: '16–22',
        ageMin: 16,
        ageMax: 22,
        capacity: 40,
        spotsLeft: 6,
        price: 8400,
        blurb: 'Our capstone — the camp that trains tomorrow’s counselors. By application.',
        description:
          'Leadership Camp is the capstone of the YWCA Camp program — an intensive, application-only experience that trains the next generation of camp counselors and community leaders. Campers who complete this program are eligible to return as volunteer leaders.',
        highlights: [
          'Application-only admission',
          'Counselor training & certification',
          'Advanced facilitation skills',
          'Mentoring younger campers',
          'Capstone leadership project',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Assessment', description: 'Welcome, baseline leadership assessment, and goal-setting.' },
          { day: 'Day 2', title: 'Facilitation Skills', description: 'Learning to lead games, manage groups, and handle challenging situations.' },
          { day: 'Day 3', title: 'Mentoring Practice', description: 'Working with younger campers — real-time facilitation with feedback.' },
          { day: 'Day 4', title: 'Conflict & Care', description: 'Workshops on conflict resolution, camper wellbeing, and safeguarding.' },
          { day: 'Day 5', title: 'Program Design', description: 'Teams design a full camp activity program from scratch.' },
          { day: 'Day 6', title: 'Capstone Project', description: 'Each participant delivers a facilitated session — peer and leader feedback.' },
          { day: 'Day 7', title: 'Certification & Commitment', description: 'Certification ceremony, commitment to return as a leader, and celebration.' },
        ],
        accent: 'teal',
        icon: Compass,
        status: 'filling',
      },
    ],
  },
  {
    id: 'winter',
    label: 'Winter 2026',
    year: 2026,
    tagline: 'Mild desert days, crisp Red Sea nights — two cozy winter camps.',
    icon: Snowflake,
    open: false,
    camps: [
      {
        id: 'winter-kids',
        slug: 'winter-kids-camp',
        name: 'Kids Camp',
        season: 'winter',
        year: 2026,
        startDate: '2026-12-20',
        endDate: '2026-12-27',
        ageRange: '7–11',
        ageMin: 7,
        ageMax: 11,
        capacity: 70,
        spotsLeft: 41,
        price: 5800,
        blurb: 'A winter warmer — beach Olympics, storytelling nights and starlit desert walks.',
        description:
          'Winter Kids Camp takes advantage of Egypt\'s mild winter weather — perfect for outdoor activities without the summer heat. Campers enjoy beach Olympics, storytelling nights, starlit desert walks, and all the character-building fun of summer camp in a cooler setting.',
        highlights: [
          'Mild winter outdoor activities',
          'Beach Olympics & team games',
          'Starlit desert walks',
          'Storytelling & campfire nights',
          'Holiday-season celebration',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Winter Welcome', description: 'Check-in, team formation, and a cozy opening campfire.' },
          { day: 'Day 2', title: 'Winter Beach Olympics', description: 'Team beach games adapted for the cooler weather — full tournament.' },
          { day: 'Day 3', title: 'Desert Walk & Stars', description: 'Afternoon desert walk, evening stargazing and storytelling.' },
          { day: 'Day 4', title: 'Creative Workshops', description: 'Arts, crafts, and drama — indoor and outdoor creative sessions.' },
          { day: 'Day 5', title: 'Team Challenge Day', description: 'The signature teamwork obstacle course and challenge stations.' },
          { day: 'Day 6', title: 'Holiday Celebration', description: 'A festive group dinner, games, and a special evening program.' },
          { day: 'Day 7', title: 'Closing Ceremony', description: 'Awards, reflections, and farewells around the final campfire.' },
        ],
        accent: 'teal',
        icon: Sparkles,
        status: 'coming-soon',
      },
      {
        id: 'winter-teen',
        slug: 'winter-teen-camp',
        name: 'Teen Camp',
        season: 'winter',
        year: 2026,
        startDate: '2026-12-29',
        endDate: '2027-01-05',
        ageRange: '12–16',
        ageMin: 12,
        ageMax: 16,
        capacity: 55,
        spotsLeft: 19,
        price: 6200,
        blurb: 'Ring in the new year with challenge courses, night games and real friendships.',
        description:
          'Winter Teen Camp rings in the new year with an energetic program of challenge courses, night games, and deep friendship-building. Teens take on more responsibility, lead activities, and reflect on their goals for the year ahead.',
        highlights: [
          'New Year\'s Eve celebration',
          'Night games & challenges',
          'Teen-led activity planning',
          'Goal-setting & reflection',
          'Adventure sports',
        ],
        itinerary: [
          { day: 'Day 1', title: 'Arrival & Resolutions', description: 'Welcome, team formation, and a New Year\'s goal-setting session.' },
          { day: 'Day 2', title: 'Challenge Course', description: 'The full teamwork obstacle course — teens lead their own teams.' },
          { day: 'Day 3', title: 'Night Games', description: 'Daytime prep, evening night games and outdoor challenges after dark.' },
          { day: 'Day 4', title: 'New Year\'s Eve', description: 'A special celebration — group dinner, games, and a midnight countdown.' },
          { day: 'Day 5', title: 'Adventure Sports', description: 'Hiking, climbing, and outdoor adventure in the mild winter weather.' },
          { day: 'Day 6', title: 'Teen-Led Day', description: 'Teens plan and run activities for their peers — building leadership.' },
          { day: 'Day 7', title: 'Reflection & Closing', description: 'Looking back on goals, sharing growth, and a final campfire.' },
        ],
        accent: 'orange',
        icon: Compass,
        status: 'coming-soon',
      },
    ],
  },
];

export const allCamps = seasons.flatMap((s) => s.camps);

export function getCampBySlug(slug: string): Camp | undefined {
  return allCamps.find((c) => c.slug === slug);
}

export const newsItems = [
  {
    id: 'n1',
    slug: 'summer-2026-registration-open',
    title: 'Summer 2026 Registration is Now Open',
    date: '2026-03-02',
    excerpt:
      'All eight summer sessions are live. Kids Camp 3 already has a waitlist — secure your spot early.',
    content:
      'We are thrilled to announce that registration for all eight Summer 2026 camps is now open. From Kids Camp 1 in June through Leadership Camp at the end of August, there is a session for every age group. Kids Camp 3 — our most popular session — already has a waitlist, so we encourage families to register early. Visit the Camps page to explore all sessions and start your registration.',
    tag: 'Announcement',
    accent: 'orange' as const,
  },
  {
    id: 'n2',
    slug: 'meet-2026-leader-cohort',
    title: 'Meet the 2026 Volunteer Leader Cohort',
    date: '2026-02-18',
    excerpt:
      'Thirty-two former campers return this year as counselors. Read about the team that makes camp happen.',
    content:
      'This year, 32 former campers are returning to Ras Sedr as volunteer counselors and activity leaders. Our leaders range from experienced veterans with over a decade of camp experience to newer young leaders stepping into their first counseling role. Every one of them was once a camper themselves — they understand the experience because they lived it. Meet the full team on our About page.',
    tag: 'Community',
    accent: 'teal' as const,
  },
  {
    id: 'n3',
    slug: 'new-challenge-course-2026',
    title: 'New Challenge Course Debuts This Season',
    date: '2026-01-30',
    excerpt:
      'A brand-new team obstacle course lands at Ras Sedr — built by alumni, designed for teamwork.',
    content:
      'Thanks to the hard work of our alumni volunteer crew, a brand-new team obstacle course is ready for the 2026 season. The course was designed and built by former campers over the winter break, and features a series of teamwork-focused challenges that span both land and water. Every station requires communication, trust, and collaboration to complete.',
    tag: 'Camp Life',
    accent: 'gold' as const,
  },
  {
    id: 'n4',
    slug: 'winter-2026-dates-announced',
    title: 'Winter 2026 Dates Announced',
    date: '2026-01-15',
    excerpt:
      'Kids Camp and Teen Camp return this December with new activities and a New Year celebration.',
    content:
      'Winter 2026 is set: Kids Camp runs December 20–27 and Teen Camp runs December 29 through January 5. Both camps take advantage of Egypt\'s mild winter weather, with outdoor activities, beach games, and a special New Year\'s celebration for the Teen Camp. Registration opens this fall.',
    tag: 'Announcement',
    accent: 'teal' as const,
  },
  {
    id: 'n5',
    slug: 'sustainability-initiative-2026',
    title: 'Camp Goes Greener This Year',
    date: '2025-12-10',
    excerpt:
      'New waste-reduction, solar power, and local sourcing initiatives make camp more sustainable than ever.',
    content:
      'As part of our commitment to a healthy, sustainable, simplistic lifestyle, we are introducing several green initiatives this year: solar-powered lighting for common areas, a comprehensive waste-reduction and recycling program, and sourcing all camp food from local Egyptian producers. Campers will also participate in a daily sustainability activity.',
    tag: 'Community',
    accent: 'gold' as const,
  },
  {
    id: 'n6',
    slug: 'alumni-reunion-2026',
    title: 'Alumni Reunion Weekend a Huge Success',
    date: '2025-11-22',
    excerpt:
      'Over 100 former campers gathered at Ras Sedr for a weekend of nostalgia, networking, and campfire songs.',
    content:
      'This past weekend, more than 100 YWCA Camp alumni returned to Ras Sedr for our annual reunion. The weekend featured classic camp games, a campfire night with songs and stories, and plenty of networking. It was a powerful reminder of the lasting friendships and character built at camp. Many alumni signed up to volunteer for the 2026 season.',
    tag: 'Camp Life',
    accent: 'orange' as const,
  },
];

export const galleryTiles = [
  { id: 'g1', label: 'Beach Olympics', accent: 'orange' as const, span: 'tall' as const, icon: Trophy },
  { id: 'g2', label: 'Team Challenges', accent: 'teal' as const, span: 'wide' as const, icon: Users },
  { id: 'g3', label: 'Campfire Nights', accent: 'gold' as const, span: 'normal' as const, icon: Star },
  { id: 'g4', label: 'Desert Treks', accent: 'teal' as const, span: 'normal' as const, icon: Mountain },
  { id: 'g5', label: 'Leadership Labs', accent: 'orange' as const, span: 'tall' as const, icon: Award },
  { id: 'g6', label: 'Sunset Games', accent: 'gold' as const, span: 'wide' as const, icon: Sun },
  { id: 'g7', label: 'Red Sea Swimming', accent: 'teal' as const, span: 'normal' as const, icon: Waves },
  { id: 'g8', label: 'Camp Life', accent: 'orange' as const, span: 'normal' as const, icon: Tent },
  { id: 'g9', label: 'Stargazing', accent: 'gold' as const, span: 'wide' as const, icon: Star },
];

export const leaders = [
  { name: 'Mariam Adel', role: 'Camp Director', years: '12 years at camp', accent: 'teal' as const, initials: 'MA', bio: 'Mariam started as a camper at age 9 and never left. She now oversees the entire camp program and leads the volunteer team.' },
  { name: 'Omar Khaled', role: 'Head of Sports', years: '9 years at camp', accent: 'orange' as const, initials: 'OK', bio: 'Omar designs the sports and physical challenge program. A former competitive swimmer, he brings energy and structure to every session.' },
  { name: 'Salma Fathy', role: 'Leadership Lead', years: '8 years at camp', accent: 'gold' as const, initials: 'SF', bio: 'Salma runs the Leadership Camp program and mentors new counselors. She is passionate about empowering young leaders.' },
  { name: 'Youssef Nabil', role: 'Activities Coordinator', years: '5 years at camp', accent: 'teal' as const, initials: 'YN', bio: 'Youssef coordinates the daily activity schedule and leads the creative arts program. A newer leader with great energy.' },
  { name: 'Nour Hassan', role: 'Wellness Lead', years: '6 years at camp', accent: 'orange' as const, initials: 'NH', bio: 'Nour oversees camper wellbeing, the sustainability program, and the campfire storytelling nights.' },
  { name: 'Ahmed Sami', role: 'Adventure Guide', years: '4 years at camp', accent: 'gold' as const, initials: 'AS', bio: 'Ahmed leads desert treks, climbing, and outdoor survival skills. One of our newest leaders, already making a big impact.' },
];

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
    category: 'Clothing',
    icon: Sun,
    items: [
      '5–7 days of comfortable, breathable clothing',
      '2 swimsuits',
      '1 light jacket or sweater for cool evenings',
      '1 set of modest clothing for group activities',
      'Pajamas',
      'Underwear & socks for 7 days',
      'Closed-toe shoes (for hiking & sports)',
      'Sandals or flip-flops (for the beach)',
      'Sun hat or cap',
    ],
  },
  {
    category: 'Sun & Water Protection',
    icon: Waves,
    items: [
      'Sunscreen SPF 50+ (reapply throughout the day)',
      'Sunglasses with UV protection',
      'Reusable water bottle (1L minimum)',
      'Beach towel',
      'Rash guard or swim shirt (recommended)',
      'Waterproof bag for wet items',
    ],
  },
  {
    category: 'Sleep & Personal',
    icon: Tent,
    items: [
      'Sleeping bag (lightweight, for mild nights)',
      'Small pillow',
      'Toiletries (toothbrush, toothpaste, soap, shampoo)',
      'Towel (quick-dry recommended)',
      'Insect repellent',
      'Personal medications (labeled, with instructions)',
    ],
  },
  {
    category: 'Optional & Fun',
    icon: Star,
    items: [
      'Journal or notebook',
      'Book to read',
      'Camera (disposable or inexpensive)',
      'Musical instrument (if you play one)',
      'Deck of cards or small travel games',
      'Reusable shopping bag for dirty laundry',
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

export type Registration = {
  id: string;
  camperName: string;
  campName: string;
  campSlug: string;
  season: string;
  age: number;
  gender: string;
  guardianName: string;
  email: string;
  phone: string;
  price: number;
  status: 'confirmed' | 'pending' | 'waitlist';
  registeredAt: string;
};

export const mockRegistrations: Registration[] = [
  { id: 'REG-001', camperName: 'Laila Mostafa', campName: 'Kids Camp 1', campSlug: 'kids-camp-1', season: 'Summer 2026', age: 9, gender: 'Female', guardianName: 'Mostafa Ali', email: 'mostafa.ali@email.com', phone: '+20 100 111 2222', price: 6500, status: 'confirmed', registeredAt: '2026-03-05T10:30:00' },
  { id: 'REG-002', camperName: 'Adam Sherif', campName: 'Kids Camp 1', campSlug: 'kids-camp-1', season: 'Summer 2026', age: 10, gender: 'Male', guardianName: 'Sherif Hassan', email: 'sherif.h@email.com', phone: '+20 101 222 3333', price: 6500, status: 'confirmed', registeredAt: '2026-03-06T14:15:00' },
  { id: 'REG-003', camperName: 'Menna Tarek', campName: 'Girls Camp', campSlug: 'girls-camp', season: 'Summer 2026', age: 14, gender: 'Female', guardianName: 'Tarek Mansour', email: 'tarek.m@email.com', phone: '+20 102 333 4444', price: 7200, status: 'confirmed', registeredAt: '2026-03-07T09:45:00' },
  { id: 'REG-004', camperName: 'Karim Walid', campName: 'Boys Camp', campSlug: 'boys-camp', season: 'Summer 2026', age: 13, gender: 'Male', guardianName: 'Walid Fahmy', email: 'walid.f@email.com', phone: '+20 103 444 5555', price: 7200, status: 'pending', registeredAt: '2026-03-08T16:20:00' },
  { id: 'REG-005', camperName: 'Habiba Saad', campName: 'Kids Camp 2', campSlug: 'kids-camp-2', season: 'Summer 2026', age: 8, gender: 'Female', guardianName: 'Saad Ibrahim', email: 'saad.i@email.com', phone: '+20 104 555 6666', price: 6500, status: 'confirmed', registeredAt: '2026-03-09T11:10:00' },
  { id: 'REG-006', camperName: 'Youssef Amr', campName: 'Leadership Camp', campSlug: 'leadership-camp', season: 'Summer 2026', age: 18, gender: 'Male', guardianName: 'Amr Seleem', email: 'amr.s@email.com', phone: '+20 105 666 7777', price: 8400, status: 'confirmed', registeredAt: '2026-03-10T13:30:00' },
  { id: 'REG-007', camperName: 'Salma Rami', campName: 'Uni Camp', campSlug: 'uni-camp', season: 'Summer 2026', age: 20, gender: 'Female', guardianName: 'Rami Galal', email: 'rami.g@email.com', phone: '+20 106 777 8888', price: 7800, status: 'pending', registeredAt: '2026-03-11T10:00:00' },
  { id: 'REG-008', camperName: 'Omar Hany', campName: 'Kids Camp 3', campSlug: 'kids-camp-3', season: 'Summer 2026', age: 11, gender: 'Male', guardianName: 'Hany Adel', email: 'hany.a@email.com', phone: '+20 107 888 9999', price: 6500, status: 'waitlist', registeredAt: '2026-03-12T15:45:00' },
  { id: 'REG-009', camperName: 'Farida Khaled', campName: 'Girls Camp', campSlug: 'girls-camp', season: 'Summer 2026', age: 15, gender: 'Female', guardianName: 'Khaled Nabil', email: 'khaled.n@email.com', phone: '+20 108 999 0000', price: 7200, status: 'confirmed', registeredAt: '2026-03-13T09:15:00' },
  { id: 'REG-010', camperName: 'Ziad Magdy', campName: 'Boys Camp', campSlug: 'boys-camp', season: 'Summer 2026', age: 14, gender: 'Male', guardianName: 'Magdy Fouad', email: 'magdy.f@email.com', phone: '+20 109 111 0000', price: 7200, status: 'confirmed', registeredAt: '2026-03-14T12:00:00' },
  { id: 'REG-011', camperName: 'Nour Wael', campName: 'Kids Camp 4', campSlug: 'kids-camp-4', season: 'Summer 2026', age: 10, gender: 'Female', guardianName: 'Wael Samy', email: 'wael.s@email.com', phone: '+20 100 222 1111', price: 6500, status: 'confirmed', registeredAt: '2026-03-15T14:30:00' },
  { id: 'REG-012', camperName: 'Malak Ehab', campName: 'Kids Camp 1', campSlug: 'kids-camp-1', season: 'Summer 2026', age: 7, gender: 'Female', guardianName: 'Ehab Tarek', email: 'ehab.t@email.com', phone: '+20 101 333 2222', price: 6500, status: 'pending', registeredAt: '2026-03-16T10:45:00' },
  { id: 'REG-013', camperName: 'Seif Islam', campName: 'Uni Camp', campSlug: 'uni-camp', season: 'Summer 2026', age: 22, gender: 'Male', guardianName: 'Islam Reda', email: 'islam.r@email.com', phone: '+20 102 444 3333', price: 7800, status: 'confirmed', registeredAt: '2026-03-17T16:00:00' },
  { id: 'REG-014', camperName: 'Laila Hossam', campName: 'Leadership Camp', campSlug: 'leadership-camp', season: 'Summer 2026', age: 19, gender: 'Female', guardianName: 'Hossam Maged', email: 'hossam.m@email.com', phone: '+20 103 555 4444', price: 8400, status: 'confirmed', registeredAt: '2026-03-18T11:30:00' },
  { id: 'REG-015', camperName: 'Ahmed Kirolos', campName: 'Kids Camp 2', campSlug: 'kids-camp-2', season: 'Summer 2026', age: 9, gender: 'Male', guardianName: 'Kirolos Emad', email: 'kirolos.e@email.com', phone: '+20 104 666 5555', price: 6500, status: 'confirmed', registeredAt: '2026-03-19T13:15:00' },
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

export function getStatusLabel(status: CampStatus): string {
  switch (status) {
    case 'open': return 'Open';
    case 'filling': return 'Almost Full';
    case 'waitlist': return 'Waitlist';
    case 'closed': return 'Closed';
    case 'coming-soon': return 'Coming Soon';
  }
}
