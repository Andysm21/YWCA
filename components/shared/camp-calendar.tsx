'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDateRange, getStatusLabel, type Camp } from '@/lib/camp-data';

type Accent = 'orange' | 'teal' | 'gold';

const accentBar: Record<Accent, string> = {
  orange: 'bg-gradient-to-r from-brand-orange to-brand-ember',
  teal: 'bg-gradient-to-r from-brand-teal to-[hsl(200_90%_50%)]',
  gold: 'bg-gradient-to-r from-brand-gold to-brand-orange',
};

const accentDot: Record<Accent, string> = {
  orange: 'bg-brand-orange',
  teal: 'bg-brand-teal',
  gold: 'bg-brand-gold',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function inRange(d: Date, start: Date, end: Date) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return t >= s && t <= e;
}

function buildGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - offset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export type CampCalendarProps = {
  camps: Camp[];
  initialMonth?: Date;
  className?: string;
  showLegend?: boolean;
  showSidePanel?: boolean;
  compact?: boolean;
};

export function CampCalendar({
  camps,
  initialMonth,
  className,
  showLegend = true,
  showSidePanel = true,
  compact = false,
}: CampCalendarProps) {
  const [month, setMonth] = React.useState(initialMonth ?? new Date('2026-06-01'));
  const [selected, setSelected] = React.useState<Camp | null>(null);
  const grid = React.useMemo(() => buildGrid(month), [month]);
  const today = new Date();

  const monthCamps = React.useMemo(
    () =>
      camps.filter((c) => {
        const s = new Date(c.startDate);
        const e = new Date(c.endDate);
        const mStart = startOfMonth(month);
        const mEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        return !(e < mStart || s > mEnd);
      }),
    [camps, month]
  );

  function campsForDay(d: Date) {
    return camps.filter((c) => inRange(d, new Date(c.startDate), new Date(c.endDate)));
  }

  return (
    <div className={cn('grid gap-6', showSidePanel ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-1', className)}>
      <div className="glass-strong rounded-2xl border border-border/60 p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">
              {MONTHS[month.getMonth()]} <span className="text-muted-foreground">{month.getFullYear()}</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              {monthCamps.length} {monthCamps.length === 1 ? 'camp' : 'camps'} this month
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 bg-transparent" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-border/60 bg-transparent" onClick={() => setMonth(new Date('2026-06-01'))}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 bg-transparent" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {DOW.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth();
            const isToday = sameDay(d, today);
            const dayCamps = campsForDay(d);
            return (
              <button
                key={i}
                onClick={() => dayCamps[0] && setSelected(dayCamps[0])}
                className={cn(
                  'group relative flex flex-col items-start gap-1 rounded-lg border border-transparent p-1.5 text-left transition-all',
                  compact ? 'min-h-[56px]' : 'min-h-[78px]',
                  !inMonth && 'opacity-35',
                  inMonth && 'hover:border-border hover:bg-muted/40',
                  dayCamps.length > 0 && 'cursor-pointer'
                )}
              >
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold', isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                  {d.getDate()}
                </span>
                <div className="flex w-full flex-col gap-0.5">
                  {dayCamps.slice(0, compact ? 1 : 2).map((c) => (
                    <span key={c.id} className={cn('truncate rounded px-1 py-0.5 text-[10px] font-semibold leading-tight text-white shadow-sm', accentBar[c.accent])}>
                      {c.name}
                    </span>
                  ))}
                  {dayCamps.length > (compact ? 1 : 2) && (
                    <span className="px-1 text-[10px] font-semibold text-muted-foreground">+{dayCamps.length - (compact ? 1 : 2)} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showLegend && (
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legend</span>
            {(['orange', 'teal', 'gold'] as Accent[]).map((a) => (
              <span key={a} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn('h-2.5 w-2.5 rounded-full', accentDot[a])} />
                {a === 'orange' ? 'Summer' : a === 'teal' ? 'Winter' : 'Special'}
              </span>
            ))}
          </div>
        )}
      </div>

      {showSidePanel && (
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">This month</h4>
          {monthCamps.length === 0 && <p className="text-sm text-muted-foreground">No camps scheduled this month.</p>}
          {monthCamps.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
            >
              <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', accentDot[c.accent])} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{c.name}</p>
                <p className="text-xs text-muted-foreground">{formatDateRange(c.startDate, c.endDate)}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-orange">{getStatusLabel(c.status)}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {c.spotsLeft} left
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <CampDetailDrawer camp={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function CampDetailDrawer({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl animate-slide-right">
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <h3 className="font-display text-xl font-bold text-white">{camp.name}</h3>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className={cn('mb-5 flex h-28 items-center justify-center rounded-xl bg-gradient-to-br', accentBar[camp.accent])}>
            <camp.icon className="h-10 w-10 text-white/90" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{camp.description}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Dates" value={formatDateRange(camp.startDate, camp.endDate)} />
            <Row label="Age range" value={`${camp.ageRange} years`} />
            <Row label="Capacity" value={`${camp.capacity} campers`} />
            <Row label="Spots left" value={`${camp.spotsLeft}`} />
            <Row label="Status" value={getStatusLabel(camp.status)} />
            <Row label="Price" value={`EGP ${camp.price.toLocaleString()}`} />
          </dl>
        </div>
        <div className="border-t border-border/60 p-5">
          <Button asChild className="w-full rounded-full glow-orange" size="lg">
            <a href={`/register/${camp.slug}`}>Register for {camp.name}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}
