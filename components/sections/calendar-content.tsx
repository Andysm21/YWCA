'use client';

import * as React from 'react';
import { CampCalendar } from '@/components/shared/camp-calendar';
import type { Camp } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

export function CalendarContent({ camps: allCamps }: { camps: Camp[] }) {
  const [seasonFilter, setSeasonFilter] = React.useState<'all' | 'summer' | 'winter'>('all');
  const [year, setYear] = React.useState(2026);
  const [month, setMonth] = React.useState(new Date('2026-06-01'));

  const camps = seasonFilter === 'all' ? allCamps : allCamps.filter((c) => c.season === seasonFilter);

  const months = [
    { label: 'Jun', value: 5 }, { label: 'Jul', value: 6 }, { label: 'Aug', value: 7 },
    { label: 'Sep', value: 8 }, { label: 'Dec', value: 11 }, { label: 'Jan', value: 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {/* Season/year switcher */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
        <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
          {(['all', 'summer', 'winter'] as const).map((s) => (
            <button key={s} onClick={() => setSeasonFilter(s)}
              className={cn('rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all',
                seasonFilter === s ? 'bg-gradient-to-r from-brand-orange to-brand-ember text-white' : 'text-muted-foreground hover:text-foreground')}>
              {s === 'all' ? 'All Seasons' : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
          {[2026, 2027].map((y) => (
            <button key={y} onClick={() => { setYear(y); setMonth(new Date(y, month.getMonth(), 1)); }}
              className={cn('rounded-full px-4 py-2 text-sm font-semibold transition-all',
                year === y ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Quick month jump */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {months.map((m) => (
          <button key={m.value} onClick={() => setMonth(new Date(year, m.value, 1))}
            className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
              month.getMonth() === m.value ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40')}>
            {m.label}
          </button>
        ))}
      </div>

      <CampCalendar camps={camps} initialMonth={month} key={`${year}-${month.getMonth()}`} />
    </div>
  );
}
