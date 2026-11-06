'use client';

import { Download } from 'lucide-react';
import { packingCategories } from '@/lib/camp-data';
import { Button } from '@/components/ui/button';

export function PackingContent() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
      <div className="mb-10 flex justify-center print:hidden">
        <Button asChild size="lg" className="rounded-full glow-orange">
          <a href="/YWCA-Camp-Packing-List.pdf" download="YWCA-Camp-Packing-List.pdf">
            <Download className="mr-2 h-4 w-4" /> Download packing list (PDF)
          </a>
        </Button>
      </div>

      <div id="packing-list" className="grid gap-6 md:grid-cols-2">
        {packingCategories.map((cat, ci) => (
          <div key={cat.category} className="rounded-2xl border border-border/60 bg-card/50 p-6 animate-fade-up print:break-inside-avoid print:border-border" style={{ animationDelay: `${ci * 80}ms` }}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary print:hidden">
                <cat.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">{cat.category}</h2>
            </div>
            <ul className="space-y-2">
              {cat.items.map((item, ii) => (
                <li key={ii} className="flex items-start gap-3 rounded-lg p-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
