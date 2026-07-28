'use client';

import * as React from 'react';
import { NewsCard } from '@/components/shared/news-card';
import { newsItems } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

export function NewsContent() {
  const [filter, setFilter] = React.useState<'all' | 'recent' | 'oldest'>('all');

  const sorted = React.useMemo(() => {
    const items = [...newsItems];
    if (filter === 'recent') items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filter === 'oldest') items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return items;
  }, [filter]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="mb-10 flex justify-center">
        <div className="flex gap-1 rounded-full border border-border/60 bg-card/50 p-1">
          {([['all', 'All'], ['recent', 'Most recent'], ['oldest', 'Oldest']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={cn('rounded-full px-5 py-2 text-sm font-semibold transition-all',
                filter === v ? 'bg-gradient-to-r from-brand-orange to-brand-ember text-white' : 'text-muted-foreground hover:text-white')}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((n) => <NewsCard key={n.id} item={n} />)}
      </div>
    </div>
  );
}
