'use client';

import * as React from 'react';
import { CampCard } from '@/components/shared/camp-card';
import { type Camp } from '@/lib/camp-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Month (1-12) from the date string itself — `new Date('YYYY-MM-DD')` parses as UTC and can land in the previous month in some timezones. */
function startMonth(c: Camp): number {
  return parseInt(c.dateStart.slice(5, 7), 10);
}

export function CampsContent({ camps }: { camps: Camp[] }) {
  const [season, setSeason] = React.useState<'all' | 'summer' | 'winter'>('all');
  const [age, setAge] = React.useState('all');
  const [month, setMonth] = React.useState('all');

  // Filter options come from the real camps, not a hardcoded list — a fixed
  // list only matched camps whose age range / month happened to equal a preset.
  const seasonOptions = React.useMemo(
    () => (['summer', 'winter'] as const).filter((s) => camps.some((c) => c.season === s)),
    [camps]
  );
  const ageOptions = React.useMemo(() => {
    const seen = new Map<string, { min: number; max: number }>();
    for (const c of camps) seen.set(`${c.ageMin}-${c.ageMax}`, { min: c.ageMin, max: c.ageMax });
    return Array.from(seen.entries())
      .sort(([, x], [, y]) => x.min - y.min || x.max - y.max)
      .map(([value, r]) => ({ value, label: `${r.min}–${r.max}` }));
  }, [camps]);
  const monthOptions = React.useMemo(
    () => Array.from(new Set(camps.map(startMonth))).sort((x, y) => x - y).map((m) => ({ value: String(m), label: MONTH_NAMES[m - 1] })),
    [camps]
  );

  const filtered = camps.filter((c) => {
    if (season !== 'all' && c.season !== season) return false;
    if (age !== 'all' && `${c.ageMin}-${c.ageMax}` !== age) return false;
    if (month !== 'all' && startMonth(c) !== parseInt(month, 10)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {/* Filters */}
      <div className="mb-12 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Season:</span>
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
            {(['all', ...seasonOptions] as const).map((s) => (
              <button key={s} onClick={() => setSeason(s)}
                className={cn('rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all',
                  season === s ? 'bg-gradient-to-r from-brand-orange to-brand-ember text-white' : 'text-muted-foreground hover:text-foreground')}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Age:</span>
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
            {[{ value: 'all', label: 'All ages' }, ...ageOptions].map((a) => (
              <button key={a.value} onClick={() => setAge(a.value)}
                className={cn('rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
                  age === a.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Month:</span>
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
            {[{ value: 'all', label: 'All months' }, ...monthOptions].map((m) => (
              <button key={m.value} onClick={() => setMonth(m.value)}
                className={cn('rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
                  month === m.value ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">{filtered.length} camp{filtered.length !== 1 ? 's' : ''} found</p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">No camps match your filters. Try adjusting them.</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => { setSeason('all'); setAge('all'); setMonth('all'); }}>Reset filters</Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: Camp, i) => (
            <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <CampCard camp={c} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
