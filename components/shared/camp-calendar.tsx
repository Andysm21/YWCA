'use client';

import * as React from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Clock, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { formatDateRange, getStatusLabel, type Camp } from '@/lib/camp-data';

type Season = Camp['season'];

const seasonBar: Record<Season, string> = {
  summer: 'bg-brand-orange',
  winter: 'bg-[hsl(228_28%_32%)] dark:bg-[hsl(228_30%_42%)]',
};
const seasonDot: Record<Season, string> = {
  summer: 'bg-brand-orange',
  winter: 'bg-brand-navy dark:bg-[hsl(228_25%_55%)]',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "2026-12-24" -> local-midnight Date (new Date('YYYY-MM-DD') would be UTC and can shift a day). */
function parseDate(s: string) {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}
const monthKey = (y: number, m: number) => y * 12 + m;
const keyYear = (k: number) => Math.floor(k / 12);
const keyMonth = (k: number) => k % 12;
const dayNum = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);

function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const rows = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7);
  return Array.from({ length: rows * 7 }, (_, i) => new Date(year, month, 1 - offset + i));
}

export type CampCalendarProps = {
  camps: Camp[];
  /** Kept for backwards compatibility; the calendar now opens on the next upcoming camp month by itself. */
  initialMonth?: Date;
  className?: string;
  showLegend?: boolean;
  showSidePanel?: boolean;
  compact?: boolean;
};

export function CampCalendar({
  camps,
  className,
  showLegend = true,
  showSidePanel = true,
  compact = false,
}: CampCalendarProps) {
  const parsed = React.useMemo(
    () => camps.map((c) => ({ camp: c, start: parseDate(c.dateStart), end: parseDate(c.dateEnd) })).sort((a, b) => +a.start - +b.start),
    [camps]
  );

  // Only months that actually contain a camp are navigable.
  const campMonths = React.useMemo(() => {
    const set = new Set<number>();
    for (const { start, end } of parsed) {
      for (let k = monthKey(start.getFullYear(), start.getMonth()); k <= monthKey(end.getFullYear(), end.getMonth()); k++) set.add(k);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [parsed]);

  const [today, setToday] = React.useState<Date | null>(null);
  const [activeKey, setActiveKey] = React.useState<number | null>(null);
  const [selected, setSelected] = React.useState<Camp | null>(null);
  const [dayPick, setDayPick] = React.useState<{ date: Date; camps: Camp[] } | null>(null);

  const nearestKey = React.useCallback(
    (now: Date) => {
      const nowKey = monthKey(now.getFullYear(), now.getMonth());
      if (campMonths.length === 0) return nowKey;
      return campMonths.find((k) => k >= nowKey) ?? campMonths[campMonths.length - 1];
    },
    [campMonths]
  );

  React.useEffect(() => {
    const now = new Date();
    setToday(now);
    setActiveKey(nearestKey(now));
  }, [nearestKey]);

  const key = activeKey ?? campMonths[0] ?? monthKey(2026, 0);
  const year = keyYear(key);
  const month = keyMonth(key);
  const grid = React.useMemo(() => buildGrid(year, month), [year, month]);
  const isEmpty = camps.length === 0;
  const idx = campMonths.indexOf(key);
  const multiYear = new Set(campMonths.map(keyYear)).size > 1;

  const monthCamps = React.useMemo(() => {
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month + 1, 0);
    return parsed.filter(({ start, end }) => !(end < mStart || start > mEnd));
  }, [parsed, year, month]);

  const nextCamp = React.useMemo(() => {
    if (!today) return null;
    const t = dayNum(today);
    return parsed.find(({ end }) => dayNum(end) >= t) ?? null;
  }, [parsed, today]);

  const campCountInMonth = (k: number) =>
    parsed.filter(({ start, end }) => monthKey(start.getFullYear(), start.getMonth()) <= k && monthKey(end.getFullYear(), end.getMonth()) >= k).length;

  const seasonsPresent = Array.from(new Set(camps.map((c) => c.season)));
  const maxBars = compact ? 1 : 2;

  function campsOn(d: Date) {
    const n = dayNum(d);
    return parsed.filter(({ start, end }) => n >= dayNum(start) && n <= dayNum(end));
  }

  function goto(k: number | undefined) {
    if (k !== undefined) setActiveKey(k);
  }

  return (
    <div className={cn('space-y-6', className)}>
      {nextCamp && (
        <NextCampBanner item={nextCamp} today={today!} onOpen={() => setSelected(nextCamp.camp)} />
      )}

      {campMonths.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {campMonths.map((k) => (
            <button
              key={k}
              onClick={() => setActiveKey(k)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                k === key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {MONTHS[keyMonth(k)].slice(0, 3)}{multiYear || k === key ? ` ${keyYear(k)}` : ''}
              <span className="ml-1.5 rounded-full bg-background/60 px-1.5 py-0.5 text-[10px]">{campCountInMonth(k)}</span>
            </button>
          ))}
        </div>
      )}

      <div className={cn('grid gap-6', showSidePanel && !isEmpty ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-1')}>
        <div className="glass-strong relative overflow-hidden rounded-2xl border border-border/60 p-4 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                {MONTHS[month]} <span className="text-muted-foreground">{year}</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEmpty ? 'No camps scheduled yet' : `${monthCamps.length} ${monthCamps.length === 1 ? 'camp' : 'camps'} this month`}
              </p>
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 bg-transparent" disabled={idx <= 0} onClick={() => goto(campMonths[idx - 1])} aria-label="Previous camp month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-border/60 bg-transparent" onClick={() => today && setActiveKey(nearestKey(today))}>
                  Next camp
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 bg-transparent" disabled={idx === -1 || idx >= campMonths.length - 1} onClick={() => goto(campMonths[idx + 1])} aria-label="Next camp month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className={cn(isEmpty && 'pointer-events-none select-none opacity-40 blur-[1px]')}>
            <div className="mb-2 grid grid-cols-7">
              {DOW.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {grid.map((d, i) => {
                const inMonth = d.getMonth() === month;
                const isToday = !!today && dayNum(d) === dayNum(today);
                const dayCamps = inMonth ? campsOn(d) : [];
                const col = i % 7;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={dayCamps.length === 0}
                    onClick={() => {
                      if (dayCamps.length === 1) setSelected(dayCamps[0].camp);
                      else if (dayCamps.length > 1) setDayPick({ date: d, camps: dayCamps.map((x) => x.camp) });
                    }}
                    className={cn(
                      'group relative flex flex-col items-start gap-1 rounded-lg border border-transparent px-1 py-1.5 text-left transition-all',
                      compact ? 'min-h-[56px]' : 'min-h-[78px]',
                      !inMonth && 'opacity-25',
                      inMonth && dayCamps.length > 0 && 'cursor-pointer hover:bg-muted/40',
                      dayCamps.length === 0 && 'cursor-default'
                    )}
                  >
                    <span className={cn('ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold', isToday ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : 'text-muted-foreground')}>
                      {d.getDate()}
                    </span>
                    <div className="flex w-full flex-col gap-0.5">
                      {dayCamps.slice(0, maxBars).map(({ camp, start, end }) => {
                        const isStart = dayNum(d) === dayNum(start);
                        const isEnd = dayNum(d) === dayNum(end);
                        const label = isStart || col === 0 || d.getDate() === 1;
                        return (
                          <span
                            key={camp.id}
                            className={cn(
                              'block h-5 whitespace-nowrap px-1.5 text-[10px] font-semibold leading-5 text-white',
                              label ? 'relative z-10 overflow-visible' : 'overflow-hidden',
                              seasonBar[camp.season],
                              isStart || col === 0 ? 'rounded-l-md' : '-ml-1 pl-2.5',
                              isEnd || col === 6 ? 'rounded-r-md' : '-mr-1'
                            )}
                          >
                            {label ? camp.name : ' '}
                          </span>
                        );
                      })}
                      {dayCamps.length > maxBars && (
                        <span className="px-1 text-[10px] font-semibold text-muted-foreground">+{dayCamps.length - maxBars} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {isEmpty && <EmptyCalendarOverlay />}

          {showLegend && !isEmpty && (
            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legend</span>
              {seasonsPresent.map((s) => (
                <span key={s} className="flex items-center gap-2 text-xs capitalize text-muted-foreground">
                  <span className={cn('h-2.5 w-2.5 rounded-full', seasonDot[s])} />
                  {s}
                </span>
              ))}
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/30" /> Today
              </span>
            </div>
          )}
        </div>

        {showSidePanel && !isEmpty && (
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">In {MONTHS[month]}</h4>
            {monthCamps.map(({ camp, start, end }) => {
              const days = dayNum(end) - dayNum(start) + 1;
              return (
                <button
                  key={camp.id}
                  onClick={() => setSelected(camp)}
                  className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                >
                  <Logo size="md" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{camp.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDateRange(camp.dateStart, camp.dateEnd)} · {days} days</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', seasonDot[camp.season])} />
                      <span className="text-xs font-semibold text-brand-orange">{getStatusLabel(camp.displayStatus)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {dayPick && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDayPick(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-foreground">{dayPick.date.getDate()} {MONTHS[dayPick.date.getMonth()]} — {dayPick.camps.length} camps</h3>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setDayPick(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {dayPick.camps.map((c) => (
                <button key={c.id} onClick={() => { setDayPick(null); setSelected(c); }} className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 text-left hover:border-primary/40">
                  <span className={cn('h-2.5 w-2.5 rounded-full', seasonDot[c.season])} />
                  <span className="font-semibold text-foreground">{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{formatDateRange(c.dateStart, c.dateEnd)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && <CampDetailDrawer camp={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function EmptyCalendarOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/40 bg-card/95 p-8 text-center shadow-2xl backdrop-blur">
        <div className="pointer-events-none absolute -inset-x-10 -top-20 h-40 rounded-full bg-gradient-to-r from-brand-orange/40 via-brand-gold/40 to-brand-ember/40 blur-3xl" />
        <div className="relative">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-ember text-white glow-orange">
              <CalendarClock className="h-10 w-10" />
            </span>
          </div>
          <h3 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">No camps on the calendar yet</h3>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" /> Coming soon
          </p>
          <p className="mt-4 text-sm text-muted-foreground">New camp dates are on their way. Check back soon — you&apos;ll see them here first!</p>
        </div>
      </div>
    </div>
  );
}

function NextCampBanner({ item, today, onOpen }: { item: { camp: Camp; start: Date; end: Date }; today: Date; onOpen: () => void }) {
  const { camp, start, end } = item;
  const t = dayNum(today);
  const running = t >= dayNum(start) && t <= dayNum(end);
  const daysTo = dayNum(start) - t;
  return (
    <button
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card/60 to-card/40 p-4 text-left transition-all hover:border-primary/60"
    >
      <Logo size="lg" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{running ? 'Happening now' : 'Next camp'}</p>
        <p className="truncate font-display text-lg font-bold text-foreground">{camp.name}</p>
        <p className="text-sm text-muted-foreground">{formatDateRange(camp.dateStart, camp.dateEnd)}</p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm font-bold text-primary sm:flex">
        <Clock className="h-4 w-4" />
        {running ? 'In progress' : daysTo === 0 ? 'Starts today' : `Starts in ${daysTo} ${daysTo === 1 ? 'day' : 'days'}`}
      </div>
    </button>
  );
}

function CampDetailDrawer({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl animate-slide-right">
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <h3 className="font-display text-xl font-bold text-foreground">{camp.name}</h3>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-brand-gold/10 to-transparent">
            <Logo size="xl" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{camp.description}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Dates" value={formatDateRange(camp.dateStart, camp.dateEnd)} />
            <Row label="Age range" value={`${camp.ageRange} years`} />
            <Row label="Status" value={getStatusLabel(camp.displayStatus)} />
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
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
