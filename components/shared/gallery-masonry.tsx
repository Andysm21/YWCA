'use client';

import * as React from 'react';
import { X, ChevronLeft, ChevronRight, Camera, Expand } from 'lucide-react';
import type { GalleryImageRow } from '@/lib/queries/gallery';
import { Reveal } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';

/** Two auto-scrolling rows of tilted "polaroid" photos moving in opposite directions. */
function Showcase({ images, onOpen }: { images: GalleryImageRow[]; onOpen: (i: number) => void }) {
  // Repeat until there is enough content to fill a wide screen, then double for a seamless loop.
  const base = React.useMemo(() => {
    const out: { img: GalleryImageRow; index: number }[] = [];
    while (out.length < 8) images.forEach((img, index) => out.length < 12 && out.push({ img, index }));
    return out;
  }, [images]);
  const rowA = base;
  const rowB = React.useMemo(() => [...base].reverse(), [base]);

  const Row = ({ items, cls }: { items: typeof base; cls: string }) => (
    <div className="marquee-pause relative flex overflow-hidden py-3 mask-fade-edges">
      <div className={cn('flex shrink-0 items-center gap-5 pr-5', cls)}>
        {[...items, ...items].map(({ img, index }, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onOpen(index)}
            className="group relative shrink-0 rounded-2xl border border-border/60 bg-card p-2 shadow-xl transition-transform duration-500 hover:z-10 hover:scale-110 hover:!rotate-0"
            style={{ transform: `rotate(${((i * 37) % 7) - 3}deg)` }}
            aria-label={img.caption ?? 'Open photo'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt={img.caption ?? 'Camp photo'} loading="lazy" decoding="async" className="h-36 w-auto rounded-xl object-cover sm:h-52" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="-mx-6 mb-14 lg:-mx-8">
      <Row items={rowA} cls="animate-marquee-slow" />
      <Row items={rowB} cls="animate-marquee-rev" />
    </div>
  );
}

/** A photo tile with 3D tilt following the pointer, glow ring, zoom and sliding caption. */
function Tile({ img, index, onOpen }: { img: GalleryImageRow; index: number; onOpen: () => void }) {
  const ref = React.useRef<HTMLButtonElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) scale(1.03)`;
  }
  function onLeave() {
    if (ref.current) ref.current.style.transform = '';
  }

  return (
    <Reveal delay={(index % 4) * 90} className="mb-5 break-inside-avoid">
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-lg transition-[transform,box-shadow] duration-300 ease-out hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.image_url} alt={img.caption ?? 'Camp photo'} loading="lazy" decoding="async" className="block h-auto w-full transition-transform duration-700 group-hover:scale-110" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
          <Expand className="h-4 w-4" />
        </div>
        {img.caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
            <span className="font-display text-base font-bold text-white drop-shadow-md">{img.caption}</span>
          </div>
        )}
      </button>
    </Reveal>
  );
}

function EmptyState() {
  const frames = [
    { r: '-8deg', x: 'left-[6%]', d: '0s' },
    { r: '4deg', x: 'left-[38%]', d: '0.8s' },
    { r: '-3deg', x: 'left-[68%]', d: '1.6s' },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        {frames.map((f) => (
          <div
            key={f.x}
            className={cn('absolute top-6 hidden h-40 w-32 rounded-xl border border-border/60 bg-card/70 p-2 shadow-lg animate-float-soft sm:block', f.x)}
            style={{ ['--r' as string]: f.r, animationDelay: f.d }}
          >
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-primary/20 via-brand-gold/10 to-transparent" />
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-ember text-white glow-orange animate-float-soft">
          <Camera className="h-9 w-9" />
        </div>
        <p className="font-display text-2xl font-extrabold text-foreground">Photos from camp are coming soon</p>
        <p className="mt-2 text-sm text-muted-foreground">Come back soon to see moments from The Camp.</p>
      </div>
    </div>
  );
}

export function GalleryMasonry({ images, limit, showcase = false }: { images: GalleryImageRow[]; limit?: number; showcase?: boolean }) {
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const shown = limit ? images.slice(0, limit) : images;
  const touchX = React.useRef<number | null>(null);

  const go = React.useCallback(
    (dir: 1 | -1) => setLightbox((cur) => (cur === null ? cur : (cur + dir + shown.length) % shown.length)),
    [shown.length]
  );

  React.useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, go]);

  if (shown.length === 0) return <EmptyState />;

  const current = lightbox !== null ? shown[lightbox] : null;

  return (
    <>
      {showcase && shown.length >= 3 && <Showcase images={shown} onOpen={setLightbox} />}

      <div className="columns-2 gap-5 sm:columns-3 lg:columns-4">
        {shown.map((img, i) => (
          <Tile key={img.id} img={img} index={i} onOpen={() => setLightbox(i)} />
        ))}
      </div>

      {current && lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setLightbox(null)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <button className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:right-6 sm:top-6" onClick={(e) => { e.stopPropagation(); setLightbox(null); }} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <button className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:left-6" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:right-6" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo">
            <ChevronRight className="h-5 w-5" />
          </button>

          <div key={current.id} className="flex max-h-[78vh] max-w-5xl flex-col items-center px-14 animate-lightbox-in" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.image_url} alt={current.caption ?? 'Camp photo'} className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]" />
            {current.caption && <p className="mt-4 text-center font-display text-lg font-bold text-white">{current.caption}</p>}
            <p className="mt-1 text-xs text-white/60">{lightbox + 1} / {shown.length}</p>
          </div>

          {shown.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 overflow-x-auto px-4 py-2" onClick={(e) => e.stopPropagation()}>
              {shown.map((img, i) => (
                <button key={img.id} onClick={() => setLightbox(i)} className={cn('h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-14 sm:w-14', i === lightbox ? 'scale-110 border-primary' : 'border-transparent opacity-50 hover:opacity-100')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
