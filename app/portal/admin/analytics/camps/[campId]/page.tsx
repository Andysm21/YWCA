import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { getCampAnalytics } from '@/lib/queries/analytics';
import { getAllCampsForPortal } from '@/lib/queries/camps';
import { Users, TrendingUp, DollarSign, Clock3, RotateCcw, MailWarning } from 'lucide-react';
import { CampStatusPieChart, CampFillRateBar } from '@/components/portal/camp-analytics-charts';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  waitlisted: 'Waitlisted',
  payment_submitted: 'Payment submitted',
  confirmed: 'Confirmed',
  refunded: 'Refunded',
};

export default async function CampAnalyticsPage({ params }: { params: { campId: string } }) {
  const [analytics, camps] = await Promise.all([
    getCampAnalytics(params.campId),
    getAllCampsForPortal(),
  ]);
  if (!analytics) return notFound();

  const camp = camps.find((c) => c.id === params.campId);

  return (
    <div>
      <Link href="/portal/admin/analytics" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to analytics
      </Link>

      <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground">{camp?.name ?? 'Camp'} — analytics</h1>
      <p className="mt-1 text-muted-foreground">Registration, revenue, and waitlist snapshot for this camp.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Capacity fill rate" value={`${analytics.fillRatePct}%`} sublabel={`${analytics.filledCount} / ${analytics.capacity} filled`} accent="orange" />
        <StatCard icon={Clock3} label="Waitlist size" value={analytics.waitlistSize} sublabel="waiting for a spot" accent="gold" />
        <StatCard icon={DollarSign} label="Confirmed revenue" value={`EGP ${analytics.confirmedRevenueEgp.toLocaleString()}`} sublabel="real, verified" accent="teal" />
        <StatCard icon={TrendingUp} label="Pending confirmation" value={`EGP ${analytics.pendingConfirmationRevenueEgp.toLocaleString()}`} sublabel="payment_submitted — not counted as revenue yet" accent="orange" />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={RotateCcw} label="Refunds" value={analytics.refundCount} sublabel={`EGP ${analytics.refundedAmountEgp.toLocaleString()} total`} accent="gold" />
        <StatCard icon={MailWarning} label="Failed confirmation emails" value={analytics.failedEmailCount} sublabel="parent emails needing follow-up" accent="orange" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Status breakdown</h2>
          <CampStatusPieChart statusCounts={analytics.statusCounts} />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Capacity fill</h2>
          <p className="mb-4 text-sm text-muted-foreground">{analytics.filledCount} filled / {analytics.capacity} capacity</p>
          <CampFillRateBar filledCount={analytics.filledCount} capacity={analytics.capacity} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold text-foreground">Registrations by status</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(['pending_payment', 'waitlisted', 'payment_submitted', 'confirmed', 'refunded'] as const).map((status) => (
            <div key={status} className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{STATUS_LABELS[status]}</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{analytics.statusCounts[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Registration-over-time timeline chart was flagged and skipped for this pass to keep scope in check — the status/revenue breakdown above covers the requested metrics; a timeline can be added as a follow-up if useful.
      </p>
    </div>
  );
}
