'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, RotateCcw, ArrowUpCircle, Loader2, ShieldAlert } from 'lucide-react';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefundDialog } from '@/components/portal/refund-dialog';
import type { RegistrationRow } from '@/lib/queries/registrations';
import type { ConfirmState } from '@/components/portal/confirm-dialog';

/**
 * Shared row-actions for the registrations table — identical for Admin and
 * Super Admin (per the brief: "Super Admin: everything Admin can do", and
 * these three actions specifically are granted to both). Only
 * seasons/camps CRUD elsewhere in the app stays Super-Admin-only.
 */
export function RegistrationActionsCell({
  registration, onConfirm,
}: {
  registration: RegistrationRow;
  onConfirm: (s: NonNullable<ConfirmState>) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = React.useState(false);
  const [overridePassword, setOverridePassword] = React.useState('');
  const [overrideError, setOverrideError] = React.useState<string | null>(null);

  async function callAction(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/registrations/${registration.id}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Action failed') as Error & { outOfOrder?: boolean; earlierPosition?: number; capacityFull?: boolean; canOverride?: boolean; wrongPassword?: boolean };
        err.outOfOrder = data.outOfOrder;
        err.earlierPosition = data.earlierPosition;
        err.capacityFull = data.capacityFull;
        err.canOverride = data.canOverride;
        err.wrongPassword = data.wrongPassword;
        throw err;
      }
      router.refresh();
      return true;
    } catch (err) {
      if (err instanceof Error && (err as any).capacityFull) {
        setBusy(false);
        if ((err as any).canOverride) {
          setOverrideError((err as any).wrongPassword ? 'Wrong password. Try again.' : null);
          setOverrideOpen(true);
        } else {
          setError(err.message);
        }
        return false;
      }
      if (err instanceof Error && (err as any).outOfOrder) {
        setBusy(false);
        onConfirm({
          title: `${registration.camper_name} isn't next in line — promote anyway?`,
          description: `There's an earlier waitlisted registration (position ${(err as any).earlierPosition}) still waiting. Promoting out of order is sometimes correct (e.g. the person ahead is unreachable or declined) but skips them in the queue — this will be recorded in the audit log.`,
          onConfirm: () => { callAction('promote', { force: true }); },
        });
        return false;
      }
      setError(err instanceof Error ? err.message : 'Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitOverride() {
    if (!overridePassword) return;
    setOverrideError(null);
    const ok = await callAction('promote', { force: true, override_password: overridePassword });
    if (ok) {
      setOverrideOpen(false);
      setOverridePassword('');
    }
  }

  async function handleRefund(reason: string) {
    setBusy(true);
    const ok = await callAction('refund', { reason });
    setBusy(false);
    if (ok) setRefundOpen(false);
  }

  if (registration.status === 'payment_submitted') {
    return (
      <div>
        <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => callAction('confirm-payment')}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />} Confirm payment
        </Button>
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </div>
    );
  }

  if (registration.status === 'confirmed') {
    return (
      <div>
        <Button size="sm" variant="ghost" className="rounded-full text-rose-400 hover:text-rose-300" disabled={busy} onClick={() => setRefundOpen(true)}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Mark refunded
        </Button>
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
        <RefundDialog
          open={refundOpen}
          camperName={registration.camper_name}
          submitting={busy}
          onCancel={() => setRefundOpen(false)}
          onConfirm={handleRefund}
        />
      </div>
    );
  }

  if (registration.status === 'waitlisted') {
    return (
      <div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={busy}
          onClick={() => onConfirm({
            title: `Promote ${registration.camper_name} from the waitlist?`,
            description: `Moves this registration to "pending payment" and emails ${registration.parent_email} a payment link. Only works if this is the earliest-waitlisted registration for this camp (strict FIFO).`,
            onConfirm: () => { callAction('promote'); },
          })}
        >
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />} Promote
        </Button>
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
        <AlertDialog open={overrideOpen} onOpenChange={(o) => { if (!o && !busy) { setOverrideOpen(false); setOverridePassword(''); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                <ShieldAlert className="h-5 w-5 text-amber-400" /> Camp is at full capacity
              </AlertDialogTitle>
              <AlertDialogDescription>
                Promoting {registration.camper_name} will put this camp over its capacity. Enter your Super Admin password to confirm. This is recorded in the audit log.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); submitOverride(); }} className="space-y-3">
              <Input
                type="password"
                autoFocus
                autoComplete="current-password"
                placeholder="Your password"
                value={overridePassword}
                onChange={(e) => setOverridePassword(e.target.value)}
                className="rounded-xl"
              />
              {overrideError && <p className="text-sm text-rose-400">{overrideError}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel type="button" disabled={busy}>Cancel</AlertDialogCancel>
                <Button type="submit" className="rounded-full" disabled={busy || !overridePassword}>
                  {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ArrowUpCircle className="mr-1.5 h-4 w-4" />} Promote anyway
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // pending_payment (guest still needs to complete Step 2) or refunded — no action available.
  return <span className="text-xs text-muted-foreground">—</span>;
}
