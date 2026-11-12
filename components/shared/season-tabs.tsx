'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CampCard } from '@/components/shared/camp-card';
import type { Season } from '@/lib/camp-data';
import { getSeasonIcon } from '@/lib/icon-map';
import { cn } from '@/lib/utils';

export function SeasonTabs({ seasons, defaultSeason = 'summer' }: { seasons: Season[]; defaultSeason?: 'summer' | 'winter' }) {
  return (
    <Tabs defaultValue={seasons.some((s) => s.type === defaultSeason) ? defaultSeason : seasons[0]?.type}>
      <div className="flex justify-center">
        <TabsList className="h-auto rounded-full border border-border/60 bg-card/50 p-1.5 md:backdrop-blur-sm">
          {seasons.map((s) => {
            const Icon = getSeasonIcon(s.iconName);
            return (
              <TabsTrigger
                key={s.id}
                value={s.type}
                className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-orange data-[state=active]:to-brand-ember data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_-4px_hsl(22_95%_56%/0.6)]"
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {seasons.map((s) => (
        <TabsContent key={s.id} value={s.type} className="mt-12">
          <p className="mb-10 text-center text-lg text-muted-foreground">{s.camps.length} camp{s.camps.length === 1 ? '' : 's'} to choose from.</p>
          <div
            className={cn(
              'grid gap-6',
              s.camps.length >= 6 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'
            )}
          >
            {s.camps.map((c, i) => (
              <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <CampCard camp={c} />
              </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
