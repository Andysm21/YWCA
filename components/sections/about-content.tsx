import { Heart, Users, Compass, Sparkles, Palette, Tent, Smile, MapPin, Clock, Stethoscope } from 'lucide-react';
import { historyTimeline } from '@/lib/camp-data';

// All content on this page comes from "The Camp - Parents Info Session - Summer 2026".

const whatIsTheCamp = [
  'Fun-filled, character-building experience.',
  'Simplistic lifestyle - creative use of simple tools for plenty of fun.',
  'Team-based activities teach acceptance of others and teamwork.',
  'Every camp has a theme presented and emphasized throughout The Camp.',
];

const values = [
  { icon: Heart, title: 'Character building' },
  { icon: Users, title: 'Leadership and teamwork' },
  { icon: Tent, title: 'Simplicity (games, food, activities)' },
  { icon: Sparkles, title: 'انطلاق' },
  { icon: Palette, title: 'Creativity' },
  { icon: Compass, title: 'Independence' },
];

const campsite = [
  'Paradise, Ras Sudr',
  'Closed and secure compound',
  '30 minutes away from the city',
  '13 huts, 1 sitting room, 1 dining room',
  'Pool, sand & grass courts',
];

const aDay = [
  ['08:00 AM', 'Wake up, morning sports'],
  ['09:00 AM', 'Breakfast'],
  ['09:30 AM', 'Hut cleaning'],
  ['10:00 AM', 'Songs & Devotion'],
  ['11:30 AM', 'Morning game, showers'],
  ['03:00 PM', 'Lunch, rest, canteen, crafts'],
  ['05:00 PM', 'Evening game, unit meeting'],
  ['08:00 PM', 'Dinner'],
  ['09:00 PM', 'Night game'],
];

const medical = [
  'We always have leaders who are doctors/pharmacists in the camp and/or on call.',
  'We have a well-stocked pharmacy and first-aid kit.',
  'For minor issues (low fever, mild diarrhea, etc.), we inform and consult parents and then administer medication.',
  'In case of emergencies, there is a hospital nearby. We always inform parents of any medical emergencies.',
];

const dos = ['Have fun', 'Make a lot of friends', 'Learn new things'];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{children}</p>;
}

export function AboutContent() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {/* What is The Camp */}
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow>What is The Camp?</Eyebrow>
        <ul className="mt-6 space-y-3 text-left">
          {whatIsTheCamp.map((line) => (
            <li key={line} className="flex gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-foreground">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Who are we */}
      <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-7">
          <Eyebrow>Who are we? YWCA</Eyebrow>
          <p className="mt-4 text-foreground">Core value: nourishing the Body, Mind, and Spirit.</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/50 p-7">
          <Eyebrow>Who are we? Leaders</Eyebrow>
          <p className="mt-4 text-foreground">We are a diverse group of former campers who volunteer to direct and lead The Camp.</p>
        </div>
      </div>

      {/* Values */}
      <div className="mt-20">
        <div className="text-center"><Eyebrow>Values we stand for</Eyebrow></div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange"><v.icon className="h-6 w-6" /></div>
              <h3 className="font-display text-lg font-bold text-foreground">{v.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="mt-24">
        <div className="text-center">
          <Eyebrow>Our history</Eyebrow>
        </div>
        <div className="mx-auto mt-12 max-w-2xl space-y-6">
          {historyTimeline.map((h, i) => (
            <div key={h.year} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">{h.year}</div>
                {i < historyTimeline.length - 1 && <div className="mt-2 h-full w-px bg-border/60" />}
              </div>
              <div className="pb-6">
                <h3 className="font-display text-lg font-bold text-foreground">{h.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{h.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The campsite */}
      <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-border/60 bg-card/50 p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><MapPin className="h-5 w-5" /></div>
          <h2 className="font-display text-2xl font-bold text-foreground">Location: new campsite since 2019</h2>
        </div>
        <ul className="mt-5 space-y-2 text-foreground">
          {campsite.map((line) => (
            <li key={line} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{line}</li>
          ))}
        </ul>
      </div>

      {/* A day in the camp */}
      <div id="a-day-at-camp" className="mx-auto mt-20 max-w-3xl scroll-mt-24">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><Clock className="h-5 w-5" /></div>
          <h2 className="font-display text-2xl font-bold text-foreground">A day in the camp</h2>
        </div>
        <ol className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card/50">
          {aDay.map(([time, what]) => (
            <li key={time} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-24 shrink-0 font-display text-sm font-bold text-primary">{time}</span>
              <span className="text-foreground">{what}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          Parents calls are accepted daily in a specific time set by the director. Two leaders will be responsible to take these calls.
        </p>
      </div>

      {/* Medical */}
      <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-border/60 bg-card/50 p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><Stethoscope className="h-5 w-5" /></div>
          <h2 className="font-display text-2xl font-bold text-foreground">Medical attention and emergencies</h2>
        </div>
        <ul className="mt-5 space-y-3 text-foreground">
          {medical.map((line) => (
            <li key={line} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{line}</li>
          ))}
        </ul>
      </div>

      {/* Dos */}
      <div className="mx-auto mt-20 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-2"><Smile className="h-5 w-5 text-primary" /><Eyebrow>The Camp rules: Dos</Eyebrow></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {dos.map((d) => (
            <div key={d} className="rounded-2xl border border-border/60 bg-card/50 p-5 font-display text-lg font-bold text-foreground">{d}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
