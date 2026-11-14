'use client';

import * as React from 'react';
import Link from 'next/link';
import { PaymentReceivedCelebration } from '@/components/shared/status-celebration';
import { Copy, Check, Loader2, Upload, PartyPopper, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateRange, formatPrice, type Camp } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

type Props = {
  camp: Camp;
  bankDetails: { iban: string | null; beneficiary: string | null; instructions: string | null };
  initialCode: string;
};

export function PaymentContent({ camp, bankDetails, initialCode }: Props) {
  const [registrationNumber, setRegistrationNumber] = React.useState(initialCode);
  const [codeLocked, setCodeLocked] = React.useState(!!initialCode);
  const [certificate, setCertificate] = React.useState<File | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ success?: boolean; waitlisted?: boolean; message?: string } | null>(null);
  const [copiedField, setCopiedField] = React.useState<'iban' | 'beneficiary' | null>(null);

  const [showLookup, setShowLookup] = React.useState(false);
  const [lookupName, setLookupName] = React.useState('');
  const [lookupMobile, setLookupMobile] = React.useState('');
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = React.useState(false);

  function copy(value: string, field: 'iban' | 'beneficiary') {
    // IBAN is displayed with spaces and the "EG" country code prefix for
    // readability, but InstaPay's "IBAN No" field expects neither — just
    // the digits. Beneficiary (Arabic text) copies as-is, unchanged.
    const clipboardValue = field === 'iban' ? value.replace(/\s/g, '').replace(/^EG/i, '') : value;
    navigator.clipboard.writeText(clipboardValue);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch('/api/register/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campSlug: camp.slug, camperName: lookupName, parentMobile: lookupMobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No matching registration found.');
      setRegistrationNumber(data.registrationNumber);
      setCodeLocked(true);
      setShowLookup(false);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'No matching registration found.');
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!registrationNumber.trim()) {
      setError('Registration number is required.');
      return;
    }
    if (!certificate || !paymentScreenshot) {
      setError('Both the certificate and payment screenshot are required.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('registrationNumber', registrationNumber.trim());
      formData.set('certificate', certificate);
      formData.set('paymentScreenshot', paymentScreenshot);

      const res = await fetch('/api/register/payment', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payment.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 lg:px-8">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 text-center sm:p-10">
          {result.waitlisted ? (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                <PartyPopper className="h-10 w-10" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Moved to the waitlist</h2>
              <p className="mt-2 text-muted-foreground">{result.message}</p>
            </>
          ) : (
            <PaymentReceivedCelebration />
          )}
          <Button asChild className="mt-8 rounded-full glow-orange">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-8">
      <div className="mb-8 rounded-xl border border-border/60 bg-background/40 p-4">
        <p className="font-semibold text-foreground">{camp.name}</p>
        <p className="text-xs text-muted-foreground">{formatDateRange(camp.dateStart, camp.dateEnd)} · EGP {formatPrice(camp.price)}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-foreground">Payment &amp; documents</h2>

        {(bankDetails.iban || bankDetails.beneficiary || bankDetails.instructions) && (
          <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bank transfer details</p>
            {bankDetails.instructions && (
              <p className="whitespace-pre-line text-sm text-foreground/80">{bankDetails.instructions}</p>
            )}
            {bankDetails.beneficiary && (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Beneficiary</p>
                  <p dir="rtl" className="text-right text-sm font-medium text-foreground">{bankDetails.beneficiary}</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="rounded-full shrink-0" onClick={() => copy(bankDetails.beneficiary!, 'beneficiary')}>
                  {copiedField === 'beneficiary' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}
            {bankDetails.iban && (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">IBAN</p>
                  <p className="text-sm font-medium text-foreground">{bankDetails.iban}</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => copy(bankDetails.iban!, 'iban')}>
                  {copiedField === 'iban' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration number *</Label>
            <div className="flex gap-2">
              <Input
                id="registrationNumber"
                required
                readOnly={codeLocked}
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="YC260001"
                className={cn('rounded-xl bg-background/50', codeLocked && 'opacity-70')}
              />
              {codeLocked && (
                <Button type="button" variant="ghost" size="sm" className="shrink-0 rounded-full" onClick={() => setCodeLocked(false)}>
                  Edit
                </Button>
              )}
            </div>
            <button type="button" onClick={() => setShowLookup((v) => !v)} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Search className="h-3 w-3" /> Lost your registration number?
            </button>
          </div>

          {showLookup && (
            <div className="space-y-3 rounded-xl border border-dashed border-border/60 bg-background/20 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lookupName">Camper full name</Label>
                  <Input id="lookupName" value={lookupName} onChange={(e) => setLookupName(e.target.value)} className="rounded-xl bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lookupMobile">Parent mobile</Label>
                  <Input id="lookupMobile" value={lookupMobile} onChange={(e) => setLookupMobile(e.target.value)} className="rounded-xl bg-background/50" />
                </div>
              </div>
              {lookupError && <p className="text-xs text-rose-400">{lookupError}</p>}
              <Button type="button" size="sm" className="rounded-full" onClick={handleLookup} disabled={lookupLoading}>
                {lookupLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null} Find my registration
              </Button>
              <p className="text-xs text-muted-foreground">
                Not sure if you already paid? <Link href="/register/status" className="text-primary hover:underline">Check my registration status</Link> instead — it won't submit anything.
              </p>
              <p className="text-xs text-muted-foreground">Can't find it? Contact support directly.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="certificate">Certificate (image, max 10MB) *</Label>
            <Input id="certificate" type="file" accept="image/*" required onChange={(e) => setCertificate(e.target.files?.[0] ?? null)} className="rounded-xl bg-background/50 file:text-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentScreenshot">Payment screenshot (image, max 10MB) *</Label>
            <Input id="paymentScreenshot" type="file" accept="image/*" required onChange={(e) => setPaymentScreenshot(e.target.files?.[0] ?? null)} className="rounded-xl bg-background/50 file:text-foreground" />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full rounded-full glow-orange" disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Upload className="mr-2 h-4 w-4" /> Submit payment</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
