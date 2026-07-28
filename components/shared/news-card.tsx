'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, type newsItems } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

type NewsItem = (typeof newsItems)[number];

const accentBg = {
  orange: 'from-brand-orange/30 via-brand-orange/8 to-transparent',
  teal: 'from-brand-teal/30 via-brand-teal/8 to-transparent',
  gold: 'from-brand-gold/30 via-brand-gold/8 to-transparent',
};

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Card className="group flex flex-col overflow-hidden border border-border/60 bg-card/50 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 animate-fade-up">
      <div className={cn('relative h-44 overflow-hidden bg-gradient-to-br', accentBg[item.accent])}>
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="rounded-full bg-background/80 backdrop-blur">{item.tag}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {formatDate(item.date)}
        </p>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-white">{item.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.excerpt}</p>
        <Link
          href={`/news/${item.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Read more
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  );
}
