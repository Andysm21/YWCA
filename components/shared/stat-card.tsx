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
    teal: 'bg-brand-teal/15 text-brand-teal',
    gold: 'bg-brand-gold/15 text-brand-gold',
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:border-primary/30">
      <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl', accentBg[accent])}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-white">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
