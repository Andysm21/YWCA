'use client';

import * as React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImageRow } from '@/lib/queries/gallery';

export function GalleryMasonry({ images, limit }: { images: GalleryImageRow[]; limit?: number }) {
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const shown = limit ? images.slice(0, limit) : images;

  if (shown.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-10 text-center text-sm text-muted-foreground">
        Photos from camp will appear here soon.
      </p>
    );
  }

  const current = lightbox !== null ? shown[lightbox] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((img, i) => (
          <button
            key={img.id}
            type="button"
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card animate-scale-in"
            style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}
            onClick={() => setLightbox(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt={img.caption ?? 'Camp photo'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-left">
                <span className="text-sm font-semibold text-white drop-shadow-md">{img.caption}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {current && lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur hover:bg-card"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            className="absolute left-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur hover:bg-card"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + shown.length) % shown.length); }}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="absolute right-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur hover:bg-card"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % shown.length); }}
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="flex max-h-[85vh] max-w-4xl flex-col items-center px-16" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.image_url} alt={current.caption ?? 'Camp photo'} className="max-h-[75vh] w-auto rounded-xl object-contain" />
            {current.caption && <p className="mt-3 text-center text-sm text-white/90">{current.caption}</p>}
            <p className="mt-1 text-xs text-white/60">Photo {lightbox + 1} of {shown.length}</p>
          </div>
        </div>
      )}
    </>
  );
}
