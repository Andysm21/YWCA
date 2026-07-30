'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CampAnalytics } from '@/lib/queries/analytics';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  waitlisted: 'Waitlisted',
  payment_submitted: 'Payment submitted',
  confirmed: 'Confirmed',
  refunded: 'Refunded',
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: '#38bdf8',
  waitlisted: '#fb7185',
  payment_submitted: '#fbbf24',
  confirmed: '#34d399',
  refunded: '#a1a1aa',
};

/** Reshapes the existing get_camp_analytics() aggregate JSON into recharts-friendly arrays — no new queries, no raw rows. */
export function CampStatusPieChart({ statusCounts }: { statusCounts: CampAnalytics['statusCounts'] }) {
  const data = Object.entries(statusCounts)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([status, count]) => ({ status, label: STATUS_LABELS[status] ?? status, value: count ?? 0 }));

  if (data.length === 0) {
    return <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">No registrations yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? '#94a3b8'} />)}
        </Pie>
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CampFillRateBar({ filledCount, capacity }: { filledCount: number; capacity: number }) {
  const remaining = Math.max(capacity - filledCount, 0);
  const data = [{ name: 'Capacity', filled: filledCount, remaining }];

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis type="number" domain={[0, Math.max(capacity, filledCount)]} hide />
        <YAxis type="category" dataKey="name" hide />
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="filled" stackId="a" fill="#e8622c" radius={[8, 0, 0, 8]} name="Filled" />
        <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" radius={[0, 8, 8, 0]} name="Remaining" />
      </BarChart>
    </ResponsiveContainer>
  );
}
