import Link from 'next/link';
import { CheckCircle2, Clock3, PartyPopper, XCircle, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RegistrationStatus } from '@/lib/queries/registrations';

type Props = {
  status: RegistrationStatus;
  registrationNumber: string;
  camperName: string;
  campName: string;
  campSlug: string;
  waitlistPosition?: number | null;
};

const STATUS_CONTENT: Record<RegistrationStatus, { icon: typeof CheckCircle2; iconClass: string; title: string; message: (p: Props) => string }> = {
  pending_payment: {
    icon: Clock3,
    iconClass: 'bg-sky-500/15 text-sky-400',
    title: 'Payment not submitted yet',
    message: () => "You haven't submitted your payment documents yet. Use the form below to complete this step.",
  },
  payment_submitted: {
    icon: Clock3,
    iconClass: 'bg-amber-500/15 text-amber-400',
    title: "You've already submitted your payment",
    message: () => "We've received your payment documents and they're under review. We'll confirm your registration shortly — no need to resubmit.",
  },
  confirmed: {
    icon: PartyPopper,
    iconClass: 'bg-emerald-500/15 text-emerald-400',
    title: 'Your registration is confirmed!',
    message: (p) => `See you at ${p.campName}! We'll be in touch with final details closer to the date.`,
  },
  waitlisted: {
    icon: ListOrdered,
    iconClass: 'bg-rose-500/15 text-rose-400',
    title: "You're on the waitlist",
    message: (p) => `${p.campName} is currently full${p.waitlistPosition ? ` — you're at position ${p.waitlistPosition}` : ''}. We'll email you if a spot opens up. No payment is needed right now.`,
  },
  refunded: {
    icon: XCircle,
    iconClass: 'bg-zinc-500/15 text-zinc-400',
    title: 'This registration has been refunded',
    message: () => "If you think this isn't right, please contact us and we'll sort it out.",
  },
};

/** Read-only status card — used both on the payment page (when a registration has moved past pending_payment) and on the standalone /register/status lookup page. */
export function RegistrationStatusView(props: Props) {
  const content = STATUS_CONTENT[props.status];
  const Icon = content.icon;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-8">
      <div className="rounded-2xl border border-border/60 bg-card/50 p-8 text-center">
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${content.iconClass}`}>
          <Icon className="h-10 w-10" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">{content.title}</h2>
        <p className="mt-2 text-muted-foreground">{content.message(props)}</p>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 text-left text-sm">
          <p className="flex justify-between"><span className="text-muted-foreground">Registration no.</span><span className="font-mono font-medium text-foreground">{props.registrationNumber}</span></p>
          <p className="mt-1 flex justify-between"><span className="text-muted-foreground">Camper</span><span className="font-medium text-foreground">{props.camperName}</span></p>
          <p className="mt-1 flex justify-between"><span className="text-muted-foreground">Camp</span><span className="font-medium text-foreground">{props.campName}</span></p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {props.status === 'pending_payment' && (
            <Button asChild className="rounded-full glow-orange">
              <Link href={`/register/${props.campSlug}/payment?code=${encodeURIComponent(props.registrationNumber)}`}>Complete payment</Link>
            </Button>
          )}
          <Button asChild variant={props.status === 'pending_payment' ? 'outline' : 'default'} className={props.status === 'pending_payment' ? 'rounded-full' : 'rounded-full glow-orange'}>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
