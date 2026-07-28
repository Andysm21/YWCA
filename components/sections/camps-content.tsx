'use client';

import * as React from 'react';
import { CampCard } from '@/components/shared/camp-card';
import { seasons, allCamps, type Camp } from '@/lib/camp-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ageGroups = [
  { label: 'All ages', value: 'all' },
  { label: '7–11', value: '7-11' },
  { label: '12–16', value: '12-16' },
  { label: '16–22', value: '16-22' },
  { label: '18–24', value: '18-24' },
];

const months = [
  { label: 'All months', value: 'all' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'December', value: '12' },
];

export function CampsContent() {
  const [season, setSeason] = React.useState<'all' | 'summer' | 'winter'>('all');
  const [age, setAge] = React.useState('all');
  const [month, setMonth] = React.useState('all');

  const filtered = allCamps.filter((c) => {
    if (season !== 'all' && c.season !== season) return false;
    if (age !== 'all' && c.ageRange !== age) return false;
    if (month !== 'all' && new Date(c.startDate).getMonth() !== parseInt(month) - 1) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {/* Filters */}
      <div className="mb-12 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Season:</span>
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
            {(['all', 'summer', 'winter'] as const).map((s) => (
              <button key={s} onClick={() => setSeason(s)}
                className={cn('rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all',
                  season === s ? 'bg-gradient-to-r from-brand-orange to-brand-ember text-white' : 'text-muted-foreground hover:text-white')}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Age:</span>
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
            {ageGroups.map((a) => (
              <button key={a.value} onClick={() => setAge(a.value)}
                className={cn('rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
                  age === a.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white')}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Month:</span>
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
            {months.map((m) => (
              <button key={m.value} onClick={() => setMonth(m.value)}
                className={cn('rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
                  month === m.value ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-white')}>
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
