'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Mail, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  sentToday: number;
  estimatedQuota: number;
};

export function EmailQuotaWidget({ sentToday, estimatedQuota }: Props) {
  const router = useRouter();
  const [retrying, setRetrying] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  const pct = Math.min((sentToday / estimatedQuota) * 100, 100);
  const nearLimit = pct >= 80;

  async function handleRetry() {
    setRetrying(true);
    setResult(null);
    try {
      const res = await fetch('/api/cron/retry-quota-failed-emails', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry failed');
      setResult(`Retried ${data.attempted} — ${data.succeeded} sent, ${data.stillFailed} still failing.`);
      router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Today's email usage</p>
            <p className="text-xs text-muted-foreground">Africa/Cairo day — our own send count, not a live Gmail quota figure</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="rounded-full" disabled={retrying} onClick={handleRetry}>
          {retrying ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
          Retry quota-failed emails now
        </Button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className={cn('font-semibold', nearLimit ? 'text-rose-400' : 'text-foreground')}>{sentToday} / ~{estimatedQuota} estimated</span>
          <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full', nearLimit ? 'bg-rose-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {result && <p className="mt-3 text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}
