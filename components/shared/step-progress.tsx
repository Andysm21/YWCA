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
    <div className="mb-12 flex items-center justify-center gap-2">
      {steps.map((s, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all',
                  done || active
                    ? 'border-primary bg-primary text-primary-foreground glow-orange'
                    : 'border-border bg-card text-muted-foreground'
                )}
              >
                {done ? <Check className="h-5 w-5" /> : <span className="text-sm font-bold">{stepNum}</span>}
              </div>
              <span className={cn('text-xs font-semibold', done || active ? 'text-primary' : 'text-muted-foreground')}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mb-6 h-px w-12 sm:w-24', stepNum < current ? 'bg-primary' : 'bg-border')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
