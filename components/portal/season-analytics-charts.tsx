'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import type { SeasonAnalytics } from '@/lib/queries/analytics';

const STATUS_COLORS = {
  pending_payment: '#38bdf8',
  waitlisted: '#fb7185',
  payment_submitted: '#fbbf24',
  confirmed: '#34d399',
  refunded: '#a1a1aa',
} as const;

const AXIS_STYLE = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' };
const TOOLTIP_STYLE = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

function shortName(name: string) {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

/** Reshapes get_season_analytics()'s `camps` array into recharts-friendly rows — no new queries. */
export function SeasonRevenueBarChart({ camps }: { camps: SeasonAnalytics['camps'] }) {
  const data = camps.map((c) => ({ name: shortName(c.campName), fullName: c.campName, confirmed: c.confirmedRevenueEgp, pending: c.pendingConfirmationRevenueEgp }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={AXIS_STYLE} />
        <YAxis tick={AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `EGP ${v.toLocaleString()}`} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="confirmed" fill="#34d399" name="Confirmed revenue" radius={[6, 6, 0, 0]} />
        <Bar dataKey="pending" fill="#fbbf24" name="Pending confirmation" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SeasonFillRateBarChart({ camps }: { camps: SeasonAnalytics['camps'] }) {
  const data = camps.map((c) => ({ name: shortName(c.campName), fullName: c.campName, fillRate: c.fillRatePct }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={AXIS_STYLE} />
        <YAxis tick={AXIS_STYLE} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v}%`} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
        <Bar dataKey="fillRate" fill="#e8622c" name="Fill rate" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Grouped bar of status counts per camp — surfaces at a glance which camps
 * have big waitlists vs which are undersubscribed. get_season_analytics()
 * doesn't currently return a per-camp status breakdown (only fill/waitlist/
 * revenue/refund rollups), so this reuses waitlistSize + filledCount +
 * (capacity - filledCount) as a proxy "confirmed+submitted / waitlisted /
 * open" split rather than the full 5-status breakdown — the full breakdown
 * would need a query shape change to get_season_analytics, which is out of
 * scope for a chart-only pass.
 */
export function SeasonStatusByCampChart({ camps }: { camps: SeasonAnalytics['camps'] }) {
  const data = camps.map((c) => ({
    name: shortName(c.campName),
    fullName: c.campName,
    filled: c.filledCount,
    waitlisted: c.waitlistSize,
    open: Math.max(c.capacity - c.filledCount, 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={AXIS_STYLE} />
        <YAxis tick={AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="filled" stackId="a" fill={STATUS_COLORS.confirmed} name="Filled (confirmed + payment submitted)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="waitlisted" stackId="a" fill={STATUS_COLORS.waitlisted} name="Waitlisted" radius={[0, 0, 0, 0]} />
        <Bar dataKey="open" stackId="a" fill="hsl(var(--muted))" name="Open spots" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
