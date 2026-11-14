import { cn } from '@/lib/utils';

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  payment_submitted: 'Payment submitted',
  confirmed: 'Confirmed',
  waitlisted: 'Waitlisted',
  refunded: 'Refunded',
};

const STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  payment_submitted: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  pending_payment: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  waitlisted: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  refunded: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', STYLES[status], className)}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
