'use client';

import * as React from 'react';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegistrationStatusView } from '@/components/sections/registration-status-view';
import type { Camp } from '@/lib/camp-data';
import type { RegistrationStatus } from '@/lib/queries/registrations';

type Props = {
  camps: Camp[];
};

type LookupResult = {
  registrationNumber: string;
  status: RegistrationStatus;
  camperName: string;
  waitlistPosition: number | null;
};

export function StatusLookupContent({ camps }: Props) {
  const [campSlug, setCampSlug] = React.useState(camps[0]?.slug ?? '');
  const [camperName, setCamperName] = React.useState('');
  const [parentMobile, setParentMobile] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<LookupResult | null>(null);

  const selectedCamp = camps.find((c) => c.slug === campSlug) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/register/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campSlug, camperName, parentMobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No matching registration found.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No matching registration found.');
    } finally {
      setLoading(false);
    }
  }

  if (result && selectedCamp) {
    return (
      <RegistrationStatusView
        status={result.status}
        registrationNumber={result.registrationNumber}
        camperName={result.camperName}
        campName={selectedCamp.name}
        campSlug={selectedCamp.slug}
        waitlistPosition={result.waitlistPosition}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 lg:px-8">
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-foreground">Check my registration status</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter the same details you registered with — no need to remember your registration number.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="campSlug">Camp *</Label>
            <select
              id="campSlug"
              required
              value={campSlug}
              onChange={(e) => setCampSlug(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground outline-none"
            >
              {camps.length === 0 && <option value="">No open camps right now</option>}
              {camps.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="camperName">Camper full name *</Label>
            <Input id="camperName" required value={camperName} onChange={(e) => setCamperName(e.target.value)} className="rounded-xl bg-background/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentMobile">Parent mobile *</Label>
            <Input id="parentMobile" required value={parentMobile} onChange={(e) => setParentMobile(e.target.value)} className="rounded-xl bg-background/50" />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full rounded-full glow-orange" disabled={loading || !campSlug}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</> : <><Search className="mr-2 h-4 w-4" /> Check status</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
