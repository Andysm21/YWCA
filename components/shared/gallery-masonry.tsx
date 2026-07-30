'use client';

import * as React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { galleryTiles } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

const accentBg = {
  orange: 'from-brand-orange/30 via-brand-orange/10 to-transparent',
  teal: 'from-brand-navy/30 via-brand-navy/10 to-transparent',
  gold: 'from-brand-gold/30 via-brand-gold/10 to-transparent',
};

const spanClass = {
  tall: 'row-span-2 min-h-[280px]',
  wide: 'col-span-2 min-h-[160px]',
  normal: 'min-h-[160px]',
};

export function GalleryMasonry() {
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  return (
    <>
      <div className="grid auto-rows-[160px] grid-cols-2 gap-4 sm:grid-cols-4">
        {galleryTiles.map((t, i) => (
          <div
            key={t.id}
            className={cn(
              'group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br',
              accentBg[t.accent],
              spanClass[t.span],
              'animate-scale-in'
            )}
            style={{ animationDelay: `${i * 70}ms` }}
            onClick={() => setLightbox(i)}
          >
            <div className="absolute inset-0 bg-grid opacity-30 transition-opacity group-hover:opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <t.icon className="mb-2 h-6 w-6 text-foreground/80" />
                <span className="font-display text-base font-bold text-white drop-shadow-md">{t.label}</span>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="rounded-full bg-background/70 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
                View
              </span>
            </div>
          </div>
        ))}
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur hover:bg-card"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
          >
            <X className="h-5 w-5" />
          </button>
          <button
            className="absolute left-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur hover:bg-card"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + galleryTiles.length) % galleryTiles.length); }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="absolute right-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur hover:bg-card"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % galleryTiles.length); }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div
            className={cn('relative flex h-[60vh] w-full max-w-3xl flex-col items-center justify-center rounded-2xl bg-gradient-to-br', accentBg[galleryTiles[lightbox].accent])}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-grid opacity-20" />
            {(() => { const Icon = galleryTiles[lightbox].icon; return <Icon className="mb-6 h-20 w-20 text-foreground/90" />; })()}
            <h3 className="font-display text-3xl font-bold text-foreground">{galleryTiles[lightbox].label}</h3>
            <p className="mt-2 text-sm text-foreground/60">Photo {lightbox + 1} of {galleryTiles.length}</p>
          </div>
        </div>
      )}
    </>
  );
}
