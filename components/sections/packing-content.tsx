'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { packingCategories } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

export function PackingContent() {
  const [checked, setChecked] = React.useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2">
        {packingCategories.map((cat, ci) => (
          <div key={cat.category} className="rounded-2xl border border-border/60 bg-card/50 p-6 animate-fade-up" style={{ animationDelay: `${ci * 80}ms` }}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <cat.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">{cat.category}</h2>
            </div>
            <ul className="space-y-2">
              {cat.items.map((item, ii) => {
                const id = `${ci}-${ii}`;
                const isChecked = checked.has(id);
                return (
                  <li key={id}>
                    <button
                      onClick={() => toggle(id)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted/30',
                        isChecked && 'opacity-50'
                      )}
                    >
                      <span className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                        isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                      )}>
                        {isChecked && <Check className="h-3 w-3" />}
                      </span>
                      <span className={cn('text-muted-foreground', isChecked && 'line-through')}>{item}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          {checked.size} item{checked.size !== 1 ? 's' : ''} checked off
        </p>
      </div>
    </div>
  );
}
