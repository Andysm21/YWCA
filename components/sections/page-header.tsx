'use client';

import * as React from 'react';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="relative isolate overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-20 top-0 h-72 w-72 hidden rounded-full bg-brand-orange/15 blur-[100px] animate-aurora md:block" />
        <div className="absolute right-0 top-10 h-64 w-64 hidden rounded-full bg-brand-navy/15 blur-[100px] animate-aurora [animation-delay:5s] md:block" />
        <div className="absolute inset-0 bg-grid opacity-15 mask-fade-b" />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-8 sm:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary animate-fade-in">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl mx-auto font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground text-balance sm:text-6xl animate-fade-up">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-pretty animate-fade-up [animation-delay:80ms]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
