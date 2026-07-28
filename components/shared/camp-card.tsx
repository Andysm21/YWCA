'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { StatusPill } from '@/components/shared/status-pill';
import { formatDateRange, formatPrice, type Camp } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

const accentClasses: Record<Camp['accent'], { ring: string; glow: string; iconBg: string; bar: string }> = {
  orange: {
    ring: 'hover:border-brand-orange/50',
    glow: 'from-brand-orange/25',
    iconBg: 'bg-brand-orange/15 text-brand-orange',
    bar: 'from-brand-orange to-brand-ember',
  },
  teal: {
    ring: 'hover:border-brand-teal/50',
    glow: 'from-brand-teal/25',
    iconBg: 'bg-brand-teal/15 text-brand-teal',
    bar: 'from-brand-teal to-[hsl(200_90%_50%)]',
  },
  gold: {
    ring: 'hover:border-brand-gold/50',
    glow: 'from-brand-gold/25',
    iconBg: 'bg-brand-gold/15 text-brand-gold',
    bar: 'from-brand-gold to-brand-orange',
  },
};

export function CampCard({ camp }: { camp: Camp }) {
  const a = accentClasses[camp.accent];
  const full = camp.spotsLeft === 0;

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden border border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:bg-card',
        a.ring
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', a.bar)} />
      <div className={cn('pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100', a.glow)} />

      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', a.iconBg)}>
            <camp.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold leading-tight text-white">{camp.name}</h3>
            <p className="text-sm text-muted-foreground">{camp.ageRange} years</p>
          </div>
        </div>
        <StatusPill status={camp.status} />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pb-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{camp.blurb}</p>
        <div className="mt-auto grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border/50 bg-background/30 px-3 py-2">
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3 w-3" /> Dates
            </p>
            <p className="mt-0.5 font-semibold text-white">{formatDateRange(camp.startDate, camp.endDate)}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/30 px-3 py-2">
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Users className="h-3 w-3" /> Spots
            </p>
            <p className="mt-0.5 font-semibold text-white">
              {camp.spotsLeft === 0 ? 'Waitlist' : `${camp.spotsLeft} / ${camp.capacity}`}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 bg-background/20 px-6 py-4">
        <div className="flex flex-col">
          <span className="font-display text-xl font-bold text-white">EGP {formatPrice(camp.price)}</span>
          <span className="text-xs text-muted-foreground">per camper</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="rounded-full text-muted-foreground hover:text-white">
            <Link href={`/camps/${camp.slug}`}>Details</Link>
          </Button>
          <Button asChild size="sm" variant={full ? 'outline' : 'default'} className={cn('rounded-full', !full && 'glow-orange')}>
            <Link href={`/register/${camp.slug}`}>
              {full ? 'Waitlist' : 'Register'}
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
