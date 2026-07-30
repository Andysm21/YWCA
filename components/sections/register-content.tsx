'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, User, Heart, PartyPopper, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { StepProgress } from '@/components/shared/step-progress';
import { formatDateRange, formatPrice, type Camp } from '@/lib/camp-data';
import { cn } from '@/lib/utils';

type Step1 = {
  camperName: string;
  dateOfBirth: string;
  mobilePhone: string;
  email: string;
  school: string;
  academicYear: string;
  tshirtSize: string;
  firstTimeCamper: boolean;
};

type Step2 = {
  parentName: string;
  parentMobile: string;
  alternateMobile: string;
  parentEmail: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  medicalCondition: string;
  additionalInfo: string;
};

const emptyStep1: Step1 = { camperName: '', dateOfBirth: '', mobilePhone: '', email: '', school: '', academicYear: '', tshirtSize: '', firstTimeCamper: false };
const emptyStep2: Step2 = { parentName: '', parentMobile: '', alternateMobile: '', parentEmail: '', emergencyContactName: '', emergencyContactNumber: '', medicalCondition: '', additionalInfo: '' };

export function RegisterContent({ camp }: { camp: Camp }) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step1, setStep1] = React.useState<Step1>(emptyStep1);
  const [step2, setStep2] = React.useState<Step2>(emptyStep2);
  const [result, setResult] = React.useState<{ registration_number: string; status: string; waitlist_position: number | null } | null>(null);

  const step1Valid = step1.camperName.trim() && step1.dateOfBirth && step1.mobilePhone.trim() &&
    /\S+@\S+\.\S+/.test(step1.email) && step1.school.trim() && step1.academicYear.trim() && step1.tshirtSize.trim();
  const step2Valid = step2.parentName.trim() && step2.parentMobile.trim() &&
    /\S+@\S+\.\S+/.test(step2.parentEmail) && step2.emergencyContactName.trim() && step2.emergencyContactNumber.trim();

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campSlug: camp.slug, ...step1, ...step2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data.registration);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting your registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <StepProgress
        steps={[{ label: 'Camper info' }, { label: 'Guardian & emergency' }, { label: 'Confirm' }]}
        current={step}
      />

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
          <span className={cn('h-3 w-3 rounded-full', camp.accent === 'orange' ? 'bg-brand-orange' : camp.accent === 'teal' ? 'bg-brand-navy' : 'bg-brand-gold')} />
          <div>
            <p className="font-semibold text-foreground">{camp.name}</p>
            <p className="text-xs text-muted-foreground">{formatDateRange(camp.dateStart, camp.dateEnd)} · Ages {camp.ageRange} · EGP {formatPrice(camp.price)}</p>
          </div>
        </div>

        {step === 1 && (
          <form className="animate-fade-up space-y-5" onSubmit={(e) => { e.preventDefault(); if (step1Valid) setStep(2); }}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary"><User className="h-4 w-4" /></div>
              <h2 className="font-display text-xl font-bold text-foreground">Camper information</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="camperName">Camper full name *</Label>
              <Input id="camperName" required placeholder="Camper's full name" className="rounded-xl bg-background/50" value={step1.camperName} onChange={(e) => setStep1({ ...step1, camperName: e.target.value })} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of birth *</Label>
                <Input id="dateOfBirth" type="date" required className="rounded-xl bg-background/50" value={step1.dateOfBirth} onChange={(e) => setStep1({ ...step1, dateOfBirth: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">Camper mobile *</Label>
                <Input id="mobilePhone" type="tel" required placeholder="+20 100 000 0000" className="rounded-xl bg-background/50" value={step1.mobilePhone} onChange={(e) => setStep1({ ...step1, mobilePhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Camper email *</Label>
              <Input id="email" type="email" required placeholder="camper@example.com" className="rounded-xl bg-background/50" value={step1.email} onChange={(e) => setStep1({ ...step1, email: e.target.value })} />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="school">School *</Label>
                <Input id="school" required className="rounded-xl bg-background/50" value={step1.school} onChange={(e) => setStep1({ ...step1, school: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic year *</Label>
                <Input id="academicYear" required placeholder="Grade 6" className="rounded-xl bg-background/50" value={step1.academicYear} onChange={(e) => setStep1({ ...step1, academicYear: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tshirtSize">T-shirt size *</Label>
                <Input id="tshirtSize" required placeholder="M" className="rounded-xl bg-background/50" value={step1.tshirtSize} onChange={(e) => setStep1({ ...step1, tshirtSize: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox checked={step1.firstTimeCamper} onCheckedChange={(v) => setStep1({ ...step1, firstTimeCamper: v === true })} />
              This is the camper's first time at YWCA Camp
            </label>
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
              <h2 className="font-display text-xl font-bold text-foreground">Guardian &amp; emergency information</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent / guardian full name *</Label>
              <Input id="parentName" required className="rounded-xl bg-background/50" value={step2.parentName} onChange={(e) => setStep2({ ...step2, parentName: e.target.value })} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parentMobile">Parent mobile *</Label>
                <Input id="parentMobile" type="tel" required placeholder="+20 100 000 0000" className="rounded-xl bg-background/50" value={step2.parentMobile} onChange={(e) => setStep2({ ...step2, parentMobile: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternateMobile">Alternate mobile</Label>
                <Input id="alternateMobile" type="tel" placeholder="Optional" className="rounded-xl bg-background/50" value={step2.alternateMobile} onChange={(e) => setStep2({ ...step2, alternateMobile: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent email *</Label>
              <Input id="parentEmail" type="email" required placeholder="parent@example.com" className="rounded-xl bg-background/50" value={step2.parentEmail} onChange={(e) => setStep2({ ...step2, parentEmail: e.target.value })} />
              {step2.parentEmail && !/\S+@\S+\.\S+/.test(step2.parentEmail) && <p className="text-xs text-rose-400">Please enter a valid email.</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Emergency contact name *</Label>
                <Input id="emergencyContactName" required className="rounded-xl bg-background/50" value={step2.emergencyContactName} onChange={(e) => setStep2({ ...step2, emergencyContactName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactNumber">Emergency contact number *</Label>
                <Input id="emergencyContactNumber" type="tel" required className="rounded-xl bg-background/50" value={step2.emergencyContactNumber} onChange={(e) => setStep2({ ...step2, emergencyContactNumber: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicalCondition">Medical conditions</Label>
              <Input id="medicalCondition" placeholder="Optional — allergies, conditions, medications" className="rounded-xl bg-background/50" value={step2.medicalCondition} onChange={(e) => setStep2({ ...step2, medicalCondition: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional info</Label>
              <Input id="additionalInfo" placeholder="Optional" className="rounded-xl bg-background/50" value={step2.additionalInfo} onChange={(e) => setStep2({ ...step2, additionalInfo: e.target.value })} />
            </div>
            <div className="rounded-xl border border-dashed border-border/60 bg-background/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">Payment details will be sent after Step 1 review. Total: <span className="font-semibold text-foreground">EGP {formatPrice(camp.price)}</span></p>
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

        {step === 3 && result && (
          <div className="animate-fade-up text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <PartyPopper className="h-10 w-10" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">{result.status === 'waitlisted' ? "You're on the waitlist!" : 'Registration submitted!'}</h2>
            <p className="mt-2 text-muted-foreground">
              {result.status === 'waitlisted'
                ? `We've added ${step1.camperName} to the waitlist for ${camp.name} (position ${result.waitlist_position}). We'll contact you at ${step2.parentEmail} if a spot opens up.`
                : `We've received ${step1.camperName}'s registration for ${camp.name}. Registration number ${result.registration_number} — a confirmation is on its way to ${step2.parentEmail}.`}
            </p>
            <div className="mx-auto mt-8 max-w-sm space-y-3 rounded-xl border border-border/60 bg-background/40 p-5 text-left text-sm">
              <Row label="Registration #" value={result.registration_number} />
              <Row label="Camp" value={camp.name} />
              <Row label="Dates" value={formatDateRange(camp.dateStart, camp.dateEnd)} />
              <Row label="Camper" value={step1.camperName} />
              <Row label="Guardian" value={step2.parentName} />
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
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
