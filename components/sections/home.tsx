'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, MapPin, Users, CalendarCheck, Sun, Snowflake, Tent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampCalendar } from '@/components/shared/camp-calendar';
import { SeasonTabs } from '@/components/shared/season-tabs';
import { GalleryMasonry } from '@/components/shared/gallery-masonry';
import { Reveal } from '@/components/shared/reveal';
import type { Season } from '@/lib/camp-data';
import type { GalleryImageRow } from '@/lib/queries/gallery';

const marqueeItems = [
  'Character building', 'Leadership and teamwork', 'Simplicity', 'Creativity',
  'Independence', 'Team-based activities', 'Fun-filled', 'Body, Mind and Spirit',
];

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-brand-orange/20 blur-[120px] animate-aurora" />
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-brand-navy/20 blur-[120px] animate-aurora [animation-delay:4s]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-brand-gold/15 blur-[100px] animate-aurora [animation-delay:8s]" />
        <div className="absolute inset-0 bg-grid opacity-20 mask-fade-b" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-24 sm:pt-32 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-primary" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            The Camp — by the YWCA
          </div>

          <h1 className="mt-8 max-w-5xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground text-balance sm:text-6xl lg:text-7xl animate-fade-up">
            A fun-filled,{' '}
            <span className="gradient-text-mix">character-building</span> experience.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl animate-fade-up [animation-delay:80ms]">
            A simple lifestyle, creative use of simple tools for plenty of fun, and team-based
            activities that teach acceptance of others and teamwork — at Paradise, Ras Sudr.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-up [animation-delay:160ms]">
            <Button asChild size="lg" className="group h-12 rounded-full px-7 text-base glow-orange">
              <Link href="/camps"><span>Register Now</span><ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-border/60 bg-card/40 px-7 text-base backdrop-blur-sm hover:bg-card">
              <Link href="/calendar"><span>View Calendar</span><Sparkles className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <dl className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-6 border-t border-border/40 pt-8 sm:grid-cols-4 animate-fade-up [animation-delay:240ms]">
            {[
              { icon: CalendarCheck, value: '1940s', label: 'YWCA camps began' },
              { icon: MapPin, value: 'Ras Sudr', label: 'Paradise campsite' },
              { icon: Users, value: 'Volunteer', label: 'Former-camper leaders' },
              { icon: Tent, value: '13', label: 'Huts on site' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 sm:items-start">
                <s.icon className="h-5 w-5 text-primary" />
                <dt className="font-display text-2xl font-bold text-foreground">{s.value}</dt>
                <dd className="text-sm text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="relative flex overflow-hidden border-y border-border/40 bg-card/30 py-4 mask-fade-edges">
        <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {item}<Tent className="h-4 w-4 text-primary/60" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeSeasonExplorer({ seasons }: { seasons: Season[] }) {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Explore the seasons</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Find the right camp</h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">Choose a season and find the camp for your age group.</p>
        </Reveal>
        <Reveal delay={120} className="mt-12">
          <SeasonTabs seasons={seasons} defaultSeason="summer" />
        </Reveal>
        <Reveal delay={200} className="mt-12 text-center">
          <Button asChild variant="outline" size="lg" className="rounded-full border-border/60 bg-card/40">
            <Link href="/camps">View all camps<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeCalendar({ seasons }: { seasons: Season[] }) {
  const allCamps = seasons.flatMap((s) => s.camps);
  return (
    <section id="calendar" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Camp calendar</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">See the whole year at a glance</h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">Every camp, every season, mapped out. Click any camp to see details and register.</p>
        </Reveal>
        <Reveal delay={120} className="mt-12">
          <CampCalendar camps={allCamps} />
        </Reveal>
      </div>
    </section>
  );
}

export function HomeHighlights() {
  const cards = [
    { icon: Sparkles, title: 'First time camper?', body: 'Everything you need to know — what to pack for camp.', cta: 'Read the guide', href: '/packing' },
  ];
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-md gap-6">
          {cards.map((h, i) => (
            <Link key={h.title} href={h.href} className="hover-tilt shimmer-sweep group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-7 transition-colors duration-300 hover:border-primary/40 hover:bg-card hover:shadow-[0_16px_50px_-16px_hsl(var(--primary)/0.35)] animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"><h.icon className="h-6 w-6" /></div>
              <h3 className="font-display text-xl font-bold text-foreground">{h.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.body}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">{h.cta}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeGalleryTeaser({ images }: { images: GalleryImageRow[] }) {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Camp life</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Moments from The Camp</h2>
          </div>
          <Button asChild variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground">
            <Link href="/gallery">View Full Gallery<ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </Reveal>
        <Reveal delay={120} className="mt-10"><GalleryMasonry images={images} limit={8} /></Reveal>
      </div>
    </section>
  );
}
