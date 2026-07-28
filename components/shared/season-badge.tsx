import { cn } from '@/lib/utils';
import type { Season } from '@/lib/camp-data';

export function SeasonBadge({
  season,
  className,
}: {
  season: Season;
  className?: string;
}) {
  const isOpen = season.open;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
        isOpen
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border bg-muted text-muted-foreground',
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', isOpen ? 'bg-primary animate-pulse' : 'bg-muted-foreground')} />
      {season.label}
      <span className="opacity-60">·</span>
      {isOpen ? 'Open' : 'Coming Soon'}
    </span>
  );
}
