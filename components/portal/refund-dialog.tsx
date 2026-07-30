'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

export function RefundDialog({
  open, camperName, submitting, onCancel, onConfirm,
}: {
  open: boolean;
  camperName: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark {camperName}&rsquo;s registration as refunded?</DialogTitle>
          <DialogDescription>
            The spot stays counted as used — it won&rsquo;t automatically reopen for the waitlist. Promote from the waitlist separately if you want to backfill it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="refundReason">Refund reason *</Label>
          <Textarea id="refundReason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Family emergency, camper withdrew" className="rounded-xl bg-background/50" />
        </div>
        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button
            className="rounded-full bg-rose-500 text-white hover:bg-rose-600"
            disabled={submitting || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Confirm refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
