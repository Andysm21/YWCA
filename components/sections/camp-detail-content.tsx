import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, Users, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/shared/status-pill';
import { formatDateRange, formatPrice, getStatusLabel, type Camp } from '@/lib/camp-data';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

export function CampDetailContent({ camp }: { camp: Camp }) {
  const a = {
    orange: { bar: 'from-brand-orange to-brand-ember', iconBg: 'bg-brand-orange/15 text-brand-orange', glow: 'from-brand-orange/20' },
    teal: { bar: 'from-brand-navy to-[hsl(228_25%_38%)]', iconBg: 'bg-brand-navy/15 text-brand-navy dark:text-indigo-300', glow: 'from-brand-navy/20' },
    gold: { bar: 'from-brand-gold to-brand-orange', iconBg: 'bg-brand-gold/15 text-brand-gold', glow: 'from-brand-gold/20' },
  }[camp.accent];

  const displayStatus = camp.displayStatus;
  const full = displayStatus === 'waitlist';

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
      <Link href="/camps" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to all camps
      </Link>

      {/* Hero */}
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-border/60">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', a.glow)} />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative p-8 sm:p-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo size="xl" />
              <div>
                <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">{camp.name}</h1>
                <p className="mt-1 text-muted-foreground capitalize">{camp.season} {camp.year}</p>
              </div>
            </div>
            <StatusPill status={displayStatus} />
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">{camp.description}</p>
        </div>
      </div>

      {/* Quick facts */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Calendar, label: 'Dates', value: formatDateRange(camp.dateStart, camp.dateEnd) },
          { icon: Users, label: 'Age range', value: `${camp.ageRange} years` },
          { icon: Users, label: 'Availability', value: getStatusLabel(displayStatus) },
          { icon: Star, label: 'Price', value: `EGP ${formatPrice(camp.price)}` },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-border/60 bg-card/50 p-4">
            <f.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</p>
            <p className="mt-0.5 font-semibold text-foreground">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/30 p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Total per camper</p>
        <p className="mt-1 font-display text-3xl font-bold text-foreground">EGP {formatPrice(camp.price)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Includes all meals, activities, equipment, and supervision.</p>
        <Button asChild size="lg" className="mt-6 w-full rounded-full glow-orange sm:w-auto">
          <Link href={`/register/${camp.slug}`}>
            {full ? 'Join Waitlist' : 'Register Now'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Paradise, Ras Sudr, Egypt
        </div>
      </div>
    </div>
  );
}
