import { cn } from '@/lib/utils';
import type { CampStatus } from '@/lib/camp-data';
import { getStatusLabel } from '@/lib/camp-data';

const statusClasses: Record<CampStatus, string> = {
  open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  filling: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  waitlist: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  closed: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  'coming-soon': 'bg-sky-500/15 text-sky-400 border-sky-500/20',
};

export function StatusPill({
  status,
  className,
}: {
  status: CampStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        statusClasses[status],
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
