import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent = 'orange',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: 'orange' | 'teal' | 'gold';
}) {
  const accentBg = {
    orange: 'bg-brand-orange/15 text-brand-orange',
    teal: 'bg-brand-navy/15 text-brand-navy dark:text-indigo-300',
    gold: 'bg-brand-gold/15 text-brand-gold',
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 transition sm:p-6-all hover:border-primary/30">
      <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl sm:mb-4 sm:h-12 sm:w-12', accentBg[accent])}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-display text-2xl font-bold sm:text-3xl text-foreground">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
