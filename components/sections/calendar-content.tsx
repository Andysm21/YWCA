'use client';

import * as React from 'react';
import { CampCalendar } from '@/components/shared/camp-calendar';
import type { Camp } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

export function CalendarContent({ camps: allCamps }: { camps: Camp[] }) {
  const [seasonFilter, setSeasonFilter] = React.useState<'all' | 'summer' | 'winter'>('all');

  const seasons = Array.from(new Set(allCamps.map((c) => c.season)));
  const camps = seasonFilter === 'all' ? allCamps : allCamps.filter((c) => c.season === seasonFilter);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {seasons.length > 1 && (
        <div className="mb-10 flex justify-center">
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
            {(['all', 'summer', 'winter'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeasonFilter(s)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all',
                  seasonFilter === s ? 'bg-gradient-to-r from-brand-orange to-brand-ember text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s === 'all' ? 'All Seasons' : s}
              </button>
            ))}
          </div>
        </div>
      )}

      <CampCalendar camps={camps} />
    </div>
  );
}
