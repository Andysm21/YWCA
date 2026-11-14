import * as React from 'react';
import { Check, Mail, PartyPopper, CreditCard, Hourglass, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepState = 'done' | 'now' | 'next';

function Steps({ steps }: { steps: { label: string; hint: string; state: StepState; icon: React.ElementType }[] }) {
  return (
    <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
      {steps.map((s, i) => (
        <li
          key={s.label}
          className={cn(
            'relative rounded-2xl border p-4 transition-all',
            s.state === 'done' && 'border-emerald-500/40 bg-emerald-500/10',
            s.state === 'now' && 'border-primary/60 bg-primary/10 shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]',
            s.state === 'next' && 'border-border/60 bg-background/30 opacity-70'
          )}
        >
          <div
            className={cn(
              'mb-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
              s.state === 'done' && 'bg-emerald-500 text-white',
              s.state === 'now' && 'bg-primary text-primary-foreground animate-pulse',
              s.state === 'next' && 'border border-border text-muted-foreground'
            )}
          >
            {s.state === 'done' ? <Check className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
          </div>
          <p className="text-sm font-bold text-foreground">{s.label}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{s.hint}</p>
          {s.state === 'now' && <span className="absolute right-3 top-3 text-[10px] font-extrabold uppercase tracking-wider text-primary">You are here</span>}
          <span className="sr-only">Step {i + 1}</span>
        </li>
      ))}
    </ol>
  );
}

function Hero({ tone, icon: Icon, title, children }: { tone: 'amber' | 'emerald'; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
        <span className={cn('absolute inset-0 animate-ping rounded-full opacity-30', tone === 'amber' ? 'bg-amber-400' : 'bg-emerald-400')} />
        <span
          className={cn(
            'relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-xl',
            tone === 'amber' ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/40' : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/40'
          )}
        >
          <Icon className="h-11 w-11" />
        </span>
      </div>
      <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground text-balance sm:text-4xl">{title}</h2>
      {children}
    </div>
  );
}

/** Shown right after the registration form is submitted: registered, payment still pending. */
export function RegisteredCelebration({ camperName, campName, email }: { camperName: string; campName: string; email: string }) {
  return (
    <div className="animate-fade-up">
      <Hero tone="amber" icon={PartyPopper} title="We've received your registration! 🎉">
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Thank you! {camperName}&apos;s form for <strong className="text-foreground">{campName}</strong> is in. One quick step left to secure the spot.
        </p>
      </Hero>

      <div className="mx-auto mt-7 max-w-xl overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 p-[2px] shadow-lg shadow-orange-500/30">
        <div className="flex items-start gap-3 rounded-[14px] bg-card px-5 py-4 text-left">
          <Mail className="mt-0.5 h-7 w-7 shrink-0 text-orange-500" />
          <div>
            <p className="text-base font-extrabold text-foreground">Check your email now — your payment link is on its way!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;re sending it to <strong className="text-foreground">{email}</strong>. Pay and upload your proof of payment to <strong className="text-foreground">secure your spot</strong>.
            </p>
          </div>
        </div>
      </div>

      <Steps
        steps={[
          { label: 'Registration received', hint: 'We have your details.', state: 'done', icon: Check },
          { label: 'Pay & upload proof', hint: 'Use the link in your email.', state: 'now', icon: CreditCard },
          { label: 'Spot secured', hint: 'We confirm by email.', state: 'next', icon: BadgeCheck },
        ]}
      />

      <p className="mx-auto mt-6 max-w-md rounded-xl border border-sky-500/40 bg-sky-500/10 p-3 text-sm text-foreground">
        📧 Can&apos;t find it within a few minutes? Check your <strong>Spam / Junk</strong> folder and mark it as &quot;Not spam&quot;.
      </p>
    </div>
  );
}

/** Shown after documents + payment proof are uploaded: waiting for staff review. */
export function PaymentReceivedCelebration({ message }: { message?: string }) {
  return (
    <div className="animate-fade-up">
      <Hero tone="emerald" icon={PartyPopper} title="We've received your documents and payment! 💚">
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Thank you — you&apos;re almost officially in.</p>
      </Hero>

      <div className="mx-auto mt-7 max-w-xl overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 p-[2px] shadow-lg shadow-emerald-500/30">
        <div className="flex items-start gap-3 rounded-[14px] bg-card px-5 py-4 text-left">
          <Hourglass className="mt-0.5 h-7 w-7 shrink-0 text-emerald-500" />
          <div>
            <p className="text-base font-extrabold text-foreground">Final confirmation coming by email</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {message ?? "Our team will review your documents and payment, then email you a final confirmation that your spot is secured."}
            </p>
          </div>
        </div>
      </div>

      <Steps
        steps={[
          { label: 'Registration received', hint: 'We have your details.', state: 'done', icon: Check },
          { label: 'Payment received', hint: 'Documents uploaded.', state: 'done', icon: CreditCard },
          { label: 'Team review', hint: "Then you'll get your spot-secured email.", state: 'now', icon: Hourglass },
        ]}
      />
    </div>
  );
}
