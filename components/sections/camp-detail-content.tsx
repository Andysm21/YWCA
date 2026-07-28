'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, Users, Check, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/shared/status-pill';
import { getCampBySlug, formatDateRange, formatPrice } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

export function CampDetailContent({ slug }: { slug: string }) {
  const camp = getCampBySlug(slug);
  if (!camp) return notFound();

  const a = {
    orange: { bar: 'from-brand-orange to-brand-ember', iconBg: 'bg-brand-orange/15 text-brand-orange', glow: 'from-brand-orange/20' },
    teal: { bar: 'from-brand-teal to-[hsl(200_90%_50%)]', iconBg: 'bg-brand-teal/15 text-brand-teal', glow: 'from-brand-teal/20' },
    gold: { bar: 'from-brand-gold to-brand-orange', iconBg: 'bg-brand-gold/15 text-brand-gold', glow: 'from-brand-gold/20' },
  }[camp.accent];

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
      <Link href="/camps" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to all camps
      </Link>

      {/* Hero */}
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-border/60">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', a.glow)} />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative p-8 sm:p-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', a.iconBg)}>
                <camp.icon className="h-7 w-7" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{camp.name}</h1>
                <p className="mt-1 text-muted-foreground capitalize">{camp.season} {camp.year}</p>
              </div>
            </div>
            <StatusPill status={camp.status} />
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">{camp.description}</p>
        </div>
      </div>

      {/* Quick facts */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Calendar, label: 'Dates', value: formatDateRange(camp.startDate, camp.endDate) },
          { icon: Users, label: 'Age range', value: `${camp.ageRange} years` },
          { icon: Users, label: 'Spots left', value: camp.spotsLeft === 0 ? 'Waitlist' : `${camp.spotsLeft} / ${camp.capacity}` },
          { icon: Star, label: 'Price', value: `EGP ${formatPrice(camp.price)}` },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-border/60 bg-card/50 p-4">
            <f.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</p>
            <p className="mt-0.5 font-semibold text-white">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        {/* Itinerary */}
        <div>
          <h2 className="font-display text-2xl font-bold text-white">7-Day Itinerary</h2>
          <p className="mt-2 text-sm text-muted-foreground">A day-by-day look at what campers will experience.</p>
          <div className="mt-6 space-y-4">
            {camp.itinerary.map((day, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border/60 bg-card/40 p-4 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">{day.day}</span>
                    <span className="text-muted-foreground">·</span>
                    <h3 className="font-semibold text-white">{day.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{day.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights + CTA */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <h3 className="font-display text-xl font-bold text-white">Camp highlights</h3>
            <ul className="mt-4 space-y-3">
              {camp.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/30 p-6">
            <p className="text-sm text-muted-foreground">Total per camper</p>
            <p className="mt-1 font-display text-3xl font-bold text-white">EGP {formatPrice(camp.price)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Includes all meals, activities, equipment, and supervision.</p>
            <Button asChild size="lg" className="mt-6 w-full rounded-full glow-orange">
              <Link href={`/register/${camp.slug}`}>
                {camp.spotsLeft === 0 ? 'Join Waitlist' : 'Register Now'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Ras Sedr, South Sinai, Egypt
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
