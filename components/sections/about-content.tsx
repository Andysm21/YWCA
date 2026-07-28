'use client';

import { Heart, Users, Compass, Leaf } from 'lucide-react';
import { leaders, historyTimeline } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

const values = [
  { icon: Heart, title: 'Character', body: 'Honesty, kindness and resilience — practiced daily through real challenges, not lectures.' },
  { icon: Users, title: 'Teamwork', body: 'Every game is built around teams. Campers learn to lead, follow, and lift each other up.' },
  { icon: Compass, title: 'Leadership', body: 'From their first camp to their last, campers grow into confident, capable leaders.' },
  { icon: Leaf, title: 'Sustainability', body: 'A simple, healthy, low-waste lifestyle lived outdoors — good for campers and the planet.' },
];

const accentRing = {
  orange: 'bg-brand-orange/15 text-brand-orange',
  teal: 'bg-brand-teal/15 text-brand-teal',
  gold: 'bg-brand-gold/15 text-brand-gold',
};

const accentBg = {
  orange: 'from-brand-orange/25 via-brand-orange/8 to-transparent',
  teal: 'from-brand-teal/25 via-brand-teal/8 to-transparent',
  gold: 'from-brand-gold/25 via-brand-gold/8 to-transparent',
};

export function AboutContent() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {/* Mission */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Our mission</p>
        <p className="mt-5 font-display text-2xl font-bold leading-snug text-white text-pretty sm:text-3xl">
          Instilling values, character, teamwork and leadership in campers through
          immersive team-based games and challenges.
        </p>
      </div>

      {/* Values */}
      <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v, i) => (
          <div key={v.title} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={cn('mb-5 flex h-12 w-12 items-center justify-center rounded-xl', accentRing.orange)}><v.icon className="h-6 w-6" /></div>
            <h3 className="font-display text-lg font-bold text-white">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
          </div>
        ))}
      </div>

      {/* Leaders */}
      <div className="mt-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Meet the leaders</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Former campers, giving back</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Our counselors are a diverse volunteer team of former campers — from experienced older leaders to newer younger ones — who came back to lead the next generation.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((l, i) => (
            <div key={l.name} className="group rounded-2xl border border-border/60 bg-card/50 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-4">
                <div className={cn('flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white', accentBg[l.accent])}>{l.initials}</div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">{l.name}</h3>
                  <p className="text-sm font-semibold text-primary">{l.role}</p>
                  <p className="text-xs text-muted-foreground">{l.years}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{l.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="mt-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Our history</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">From 30 campers to 600+</h2>
        </div>
        <div className="mt-12 space-y-6">
          {historyTimeline.map((h, i) => (
            <div key={h.year} className="flex gap-6 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary text-xs font-bold">{h.year}</div>
                {i < historyTimeline.length - 1 && <div className="mt-2 h-full w-px bg-border/60" />}
              </div>
              <div className="pb-6">
                <h3 className="font-display text-lg font-bold text-white">{h.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{h.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
