'use client';

import * as React from 'react';
import Link from 'next/link';
import { Snowflake, Sun, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Falling snow over the whole viewport (pointer-events none). Adapts its colour to light/dark mode. */
export function SnowEffect() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    type Flake = { x: number; y: number; r: number; v: number; phase: number; sway: number };
    let flakes: Flake[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(150, Math.round(w / 9));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 3.2,
        v: 0.4 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        sway: 0.3 + Math.random() * 0.9,
      }));
    }

    function draw() {
      const dark = document.documentElement.classList.contains('dark');
      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(120,165,225,0.8)';
      ctx!.strokeStyle = dark ? 'transparent' : 'rgba(255,255,255,0.9)';
      ctx!.lineWidth = 0.8;
      t += 0.01;
      for (const f of flakes) {
        f.y += f.v * (0.6 + f.r / 4);
        f.x += Math.sin(t * f.sway + f.phase) * 0.6;
        if (f.y > h + 6) { f.y = -6; f.x = Math.random() * w; }
        if (f.x > w + 6) f.x = -6;
        if (f.x < -6) f.x = w + 6;
        ctx!.beginPath();
        ctx!.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx!.fill();
        if (!dark) ctx!.stroke();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    }

    function onVisibility() {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[5]" />;
}

const wavePath = (fill: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'><path d='M0 70 C 200 38, 400 38, 600 70 S 1000 102, 1200 70 V120 H0 Z' fill='${fill}'/></svg>`
  )}")`;

/** Layered, slowly rolling tides along the bottom of the hero, plus a warm sun glow. */
export function TideWaves() {
  const layers = [
    { cls: 'animate-wave-3 h-24 sm:h-32 opacity-40', fill: 'hsl(199 90% 60%)' },
    { cls: 'animate-wave-2 h-20 sm:h-28 opacity-55', fill: 'hsl(190 85% 50%)' },
    { cls: 'animate-wave-1 h-14 sm:h-20 opacity-75', fill: 'hsl(205 90% 45%)' },
  ];
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-brand-gold/50 via-brand-orange/25 to-transparent blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-14 z-0 h-28 overflow-hidden sm:h-32">
        {layers.map((l) => (
          <div
            key={l.fill}
            className={cn('absolute inset-x-0 bottom-0 bg-repeat-x', l.cls)}
            style={{ backgroundImage: wavePath(l.fill), backgroundSize: '1200px 100%' }}
          />
        ))}
      </div>
    </>
  );
}

type OpenSeason = { id: string; type: 'summer' | 'winter'; year: number };

/** Big "WINTER SEASON 2026 IS OPEN" / "SUMMER SEASON 2026 IS OPEN" banner(s). */
export function SeasonOpenBanner({ seasons }: { seasons: OpenSeason[] }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {seasons.map((s) => {
        const winter = s.type === 'winter';
        return (
          <Link
            key={s.id}
            href="/camps"
            className={cn(
              'group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-xl transition-transform duration-300 hover:scale-[1.03] sm:px-8 sm:py-3.5 sm:text-base animate-fade-in',
              'bg-gradient-to-r animate-banner-shimmer',
              winter
                ? 'from-sky-500 via-cyan-300 to-sky-500 shadow-sky-500/40 [text-shadow:0_1px_2px_rgba(0,40,90,0.45)]'
                : 'from-brand-orange via-brand-gold to-brand-orange shadow-brand-orange/40 [text-shadow:0_1px_2px_rgba(90,30,0,0.4)]'
            )}
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
            </span>
            {winter ? <Snowflake className="h-5 w-5 animate-spin-slow" /> : <Sun className="h-5 w-5 animate-spin-slow" />}
            <span>{s.type} season {s.year} is open</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        );
      })}
    </div>
  );
}
