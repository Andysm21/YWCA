'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, RotateCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RegistrationEmailStatus } from '@/lib/queries/registrations';

/** Green check = sent, red X + tooltip = failed (with reason), clock = pending. Shared by Admin and Super Admin registrations tables. */
export function EmailStatusCell({
  registrationId, status, failureReason,
}: {
  registrationId: string;
  status: RegistrationEmailStatus;
  failureReason: string | null;
}) {
  const router = useRouter();
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/registrations/${registrationId}/resend-email`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setResending(false);
    }
  }

  if (status === 'sent') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Email sent" />;
  }

  if (status === 'pending') {
    return <Clock className="h-4 w-4 text-muted-foreground" aria-label="Email pending" />;
  }

  // failed
  return (
    <div className="flex items-center gap-1.5">
      <span title={failureReason ?? 'Send failed'}>
        <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
        disabled={resending}
        title={error ?? `Resend email${failureReason ? ` (last error: ${failureReason})` : ''}`}
        onClick={handleResend}
      >
        {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className={cn('h-3.5 w-3.5', error && 'text-rose-400')} />}
      </Button>
    </div>
  );
}
