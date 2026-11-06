'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StepProgress({
  steps,
  current,
}: {
  steps: { label: string }[];
  current: number;
}) {
  return (
    <div className="mb-10 flex items-start justify-center gap-1 sm:mb-12 sm:items-center sm:gap-2">
      {steps.map((s, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <React.Fragment key={i}>
            <div className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-auto">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center sm:h-11 sm:w-11 justify-center rounded-full border-2 transition-all',
                  done || active
                    ? 'border-primary bg-primary text-primary-foreground glow-orange'
                    : 'border-border bg-card text-muted-foreground'
                )}
              >
                {done ? <Check className="h-5 w-5" /> : <span className="text-sm font-bold">{stepNum}</span>}
              </div>
              <span className={cn('text-center text-[11px] font-semibold leading-tight sm:text-xs', done || active ? 'text-primary' : 'text-muted-foreground')}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mt-[18px] h-px w-3 shrink-0 sm:mb-6 sm:mt-0 sm:w-16 md:w-24', stepNum < current ? 'bg-primary' : 'bg-border')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
