'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, User, Heart, PartyPopper, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StepProgress } from '@/components/shared/step-progress';
import { getCampBySlug, formatDateRange, formatPrice } from '@/lib/camp-data';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

export function RegisterContent({ campSlug }: { campSlug: string }) {
  const camp = getCampBySlug(campSlug);
  if (!camp) return notFound();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step1, setStep1] = React.useState({ camperName: '', age: '', gender: '' });
  const [step2, setStep2] = React.useState({ guardianName: '', email: '', phone: '', notes: '' });

  const step1Valid = step1.camperName.trim() && step1.age && parseInt(step1.age) >= 5 && parseInt(step1.age) <= 25 && step1.gender;
  const step2Valid = step2.guardianName.trim() && /\S+@\S+\.\S+/.test(step2.email) && step2.phone.trim();

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('registrations').insert({
        camp_slug: camp!.slug,
        camp_name: camp!.name,
        season: `${camp!.season.charAt(0).toUpperCase() + camp!.season.slice(1)} ${camp!.year}`,
        camper_name: step1.camperName,
        age: parseInt(step1.age),
        gender: step1.gender,
        guardian_name: step2.guardianName,
        email: step2.email,
        phone: step2.phone,
        notes: step2.notes || null,
        price: camp!.price,
        status: camp!.spotsLeft === 0 ? 'waitlist' : 'pending',
      });
      if (insertError) throw insertError;
      setStep(3);
    } catch {
      setError('Something went wrong submitting your registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <StepProgress
        steps={[{ label: 'Camper info' }, { label: 'Guardian & payment' }, { label: 'Confirm' }]}
        current={step}
      />

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
          <span className={cn('h-3 w-3 rounded-full', camp.accent === 'orange' ? 'bg-brand-orange' : camp.accent === 'teal' ? 'bg-brand-teal' : 'bg-brand-gold')} />
          <div>
            <p className="font-semibold text-white">{camp.name}</p>
            <p className="text-xs text-muted-foreground">{formatDateRange(camp.startDate, camp.endDate)} · Ages {camp.ageRange} · EGP {formatPrice(camp.price)}</p>
          </div>
        </div>

        {step === 1 && (
          <form className="animate-fade-up space-y-5" onSubmit={(e) => { e.preventDefault(); if (step1Valid) setStep(2); }}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary"><User className="h-4 w-4" /></div>
              <h2 className="font-display text-xl font-bold text-white">Camper information</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="camperName">Camper full name *</Label>
              <Input id="camperName" required placeholder="Camper's full name" className="rounded-xl bg-background/50" value={step1.camperName} onChange={(e) => setStep1({ ...step1, camperName: e.target.value })} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Camper age *</Label>
                <Input id="age" type="number" required min={5} max={25} placeholder="12" className="rounded-xl bg-background/50" value={step1.age} onChange={(e) => setStep1({ ...step1, age: e.target.value })} />
                {step1.age && (parseInt(step1.age) < camp.ageMin || parseInt(step1.age) > camp.ageMax) && (
                  <p className="text-xs text-amber-400">This camp is for ages {camp.ageRange}. Registration may be reviewed.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={step1.gender} onValueChange={(v) => setStep1({ ...step1, gender: v })}>
                  <SelectTrigger className="rounded-xl bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" size="lg" className="rounded-full glow-orange" disabled={!step1Valid}>
                Continue to Step 2 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="animate-fade-up space-y-5" onSubmit={(e) => { e.preventDefault(); if (step2Valid) handleSubmit(); }}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary"><Heart className="h-4 w-4" /></div>
              <h2 className="font-display text-xl font-bold text-white">Guardian &amp; payment information</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianName">Parent / guardian full name *</Label>
              <Input id="guardianName" required placeholder="Parent's full name" className="rounded-xl bg-background/50" value={step2.guardianName} onChange={(e) => setStep2({ ...step2, guardianName: e.target.value })} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required placeholder="you@example.com" className="rounded-xl bg-background/50" value={step2.email} onChange={(e) => setStep2({ ...step2, email: e.target.value })} />
                {step2.email && !/\S+@\S+\.\S+/.test(step2.email) && <p className="text-xs text-rose-400">Please enter a valid email.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" required placeholder="+20 100 000 0000" className="rounded-xl bg-background/50" value={step2.phone} onChange={(e) => setStep2({ ...step2, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (allergies, medical conditions, etc.)</Label>
              <Input id="notes" placeholder="Optional" className="rounded-xl bg-background/50" value={step2.notes} onChange={(e) => setStep2({ ...step2, notes: e.target.value })} />
            </div>
            <div className="rounded-xl border border-dashed border-border/60 bg-background/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">Payment will be collected after confirmation. Total: <span className="font-semibold text-white">EGP {formatPrice(camp.price)}</span></p>
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex justify-between pt-2">
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" size="lg" className="rounded-full glow-orange" disabled={!step2Valid || submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <>Review &amp; confirm <Check className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="animate-fade-up text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <PartyPopper className="h-10 w-10" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">{camp.spotsLeft === 0 ? 'You\'re on the waitlist!' : 'Registration submitted!'}</h2>
            <p className="mt-2 text-muted-foreground">
              {camp.spotsLeft === 0
                ? `We've added ${step1.camperName} to the waitlist for ${camp.name}. We'll contact you at ${step2.email} if a spot opens up.`
                : `We've received ${step1.camperName}'s registration for ${camp.name}. A confirmation email is on its way to ${step2.email}.`}
            </p>
            <div className="mx-auto mt-8 max-w-sm space-y-3 rounded-xl border border-border/60 bg-background/40 p-5 text-left text-sm">
              <Row label="Camp" value={camp.name} />
              <Row label="Dates" value={formatDateRange(camp.startDate, camp.endDate)} />
              <Row label="Camper" value={step1.camperName} />
              <Row label="Age" value={step1.age} />
              <Row label="Guardian" value={step2.guardianName} />
              <Row label="Total" value={`EGP ${formatPrice(camp.price)}`} />
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="outline" className="rounded-full"><Link href="/camps">Browse other camps</Link></Button>
              <Button asChild className="rounded-full glow-orange"><Link href="/">Back to home</Link></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}
