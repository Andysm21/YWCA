import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Users, DollarSign, RotateCcw, Clock3 } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { getSeasonAnalytics } from '@/lib/queries/analytics';
import { getAllSeasonsWithCampsForPortal } from '@/lib/queries/camps';
import { SeasonRevenueBarChart, SeasonFillRateBarChart, SeasonStatusByCampChart } from '@/components/portal/season-analytics-charts';

export default async function SeasonAnalyticsPage({ params }: { params: { seasonId: string } }) {
  const [analytics, seasons] = await Promise.all([
    getSeasonAnalytics(params.seasonId),
    getAllSeasonsWithCampsForPortal(),
  ]);
  if (!analytics) return notFound();

  const season = seasons.find((s) => s.id === params.seasonId);

  return (
    <div>
      <Link href="/portal/admin/analytics" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to analytics
      </Link>

      <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground">{season?.label ?? 'Season'} — analytics</h1>
      <p className="mt-1 text-muted-foreground">Rolled up across all camps in this season.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        <StatCard icon={Users} label="Total registrations" value={analytics.totalRegistrations} sublabel="across all camps" accent="orange" />
        <StatCard icon={DollarSign} label="Confirmed revenue" value={`EGP ${analytics.totalConfirmedRevenueEgp.toLocaleString()}`} sublabel="real, verified" accent="teal" />
        <StatCard icon={Clock3} label="Waitlist size" value={analytics.totalWaitlistSize} sublabel="waiting across all camps" accent="gold" />
        <StatCard icon={RotateCcw} label="Refunds" value={analytics.totalRefundCount} sublabel={`EGP ${analytics.totalRefundedAmountEgp.toLocaleString()} total`} accent="orange" />
      </div>

      {analytics.camps.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">Revenue per camp</h2>
            <SeasonRevenueBarChart camps={analytics.camps} />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">Fill rate per camp</h2>
            <SeasonFillRateBarChart camps={analytics.camps} />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6 lg:col-span-2">
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">Filled vs. waitlisted vs. open, per camp</h2>
            <SeasonStatusByCampChart camps={analytics.camps} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold text-foreground">Camps in this season</h2>
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">Camp</th>
                <th className="px-5 py-3">Fill rate</th>
                <th className="px-5 py-3">Waitlist</th>
                <th className="px-5 py-3">Confirmed revenue</th>
                <th className="px-5 py-3">Pending confirmation</th>
                <th className="px-5 py-3">Refunds</th>
              </tr>
            </thead>
            <tbody>
              {analytics.camps.map((c) => (
                <tr key={c.campId} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/portal/admin/camps/${c.campId}`} className="font-medium text-foreground hover:text-primary hover:underline">
                      {c.campName}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={c.fillRatePct >= 90 ? 'font-semibold text-rose-400' : c.fillRatePct >= 60 ? 'font-semibold text-amber-400' : 'text-foreground'}>
                      {c.fillRatePct}%
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">({c.filledCount}/{c.capacity})</span>
                  </td>
                  <td className="px-5 py-3">{c.waitlistSize}</td>
                  <td className="px-5 py-3 font-medium text-foreground">EGP {c.confirmedRevenueEgp.toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted-foreground">EGP {c.pendingConfirmationRevenueEgp.toLocaleString()}</td>
                  <td className="px-5 py-3">{c.refundCount} <span className="text-xs text-muted-foreground">(EGP {c.refundedAmountEgp.toLocaleString()})</span></td>
                </tr>
              ))}
              {analytics.camps.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">No camps in this season.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
