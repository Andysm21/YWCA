'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, CalendarCheck, DollarSign, TrendingUp, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { AdminDataTable, type Column } from '@/components/shared/admin-data-table';
import { EmailStatusCell } from '@/components/portal/email-status-cell';
import { RegistrationActionsCell } from '@/components/portal/registration-actions-cell';
import { ConfirmDialog, type ConfirmState } from '@/components/portal/confirm-dialog';
import type { Camp } from '@/lib/camp-data';
import type { RegistrationRow } from '@/lib/queries/registrations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const statusBadge: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  payment_submitted: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  pending_payment: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  waitlisted: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  refunded: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

type Props = {
  registrations: RegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  stats: { totalCount: number; confirmedCount: number; totalRevenue: number };
  camps: Camp[];
  campBreakdown: { campId: string; name: string; slug: string; capacity: number; total: number; confirmed: number; revenue: number }[];
  campFilter: string;
  statusFilter: string;
};

export function PortalAdminContent({ registrations, totalCount, page, pageSize, stats, camps, campBreakdown, campFilter, statusFilter }: Props) {
  const router = useRouter();
  const [confirmState, setConfirmState] = React.useState<ConfirmState>(null);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams({ camp: campFilter, status: statusFilter, page: '1', ...next });
    router.push(`/portal/admin?${params.toString()}`);
  }

  const totalCapacity = camps.reduce((s, c) => s + c.capacity, 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns: Column<RegistrationRow>[] = [
    { key: 'registration_number', label: 'Reg #', sortable: true, render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.registration_number}</span> },
    { key: 'camper_name', label: 'Camper', sortable: true, render: (r) => <Link href={`/portal/admin/registrations/${r.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{r.camper_name}</Link> },
    { key: 'camps', label: 'Camp', render: (r) => r.camp_id ? <Link href={`/portal/admin/camps/${r.camp_id}`} className="hover:text-primary hover:underline">{r.camps?.name ?? '—'}</Link> : (r.camps?.name ?? '—') },
    { key: 'created_at', label: 'Registered', sortable: true, render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => (
      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusBadge[r.status])}>{r.status.replace('_', ' ')}</span>
    ) },
    { key: 'parent_name', label: 'Guardian', sortable: true },
    { key: 'email', label: 'Contact', render: (r) => (
      <div className="text-xs">
        <p className="text-foreground/80">{r.email}</p>
        <p className="text-muted-foreground">{r.mobile_phone}</p>
      </div>
    ) },
    { key: 'email_status', label: 'Email', render: (r) => (
      <EmailStatusCell registrationId={r.id} status={r.email_status} failureReason={r.email_failure_reason} />
    ) },
    { key: 'actions', label: 'Actions', render: (r) => (
      <RegistrationActionsCell registration={r} onConfirm={setConfirmState} />
    ) },
  ];

  const exportHref = (() => {
    const p = new URLSearchParams();
    if (campFilter !== 'all') p.set('camp', campFilter);
    if (statusFilter !== 'all') p.set('status', statusFilter);
    return `/api/portal/registrations/export${p.toString() ? `?${p}` : ''}`;
  })();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="mt-1 text-muted-foreground">Confirm payments, mark refunds, and promote from the waitlist. Season/camp management is Super Admin only.</p>
        </div>
        <Button asChild variant="outline" className="rounded-full border-border/60 bg-card/50">
          <a href={exportHref} download><Download className="mr-2 h-4 w-4" /> Export all to Excel</a>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        <StatCard icon={Users} label="Total registrations" value={stats.totalCount} sublabel={`${stats.confirmedCount} confirmed`} accent="orange" />
        <StatCard icon={CalendarCheck} label="Spots filled" value={stats.confirmedCount} sublabel={`of ${totalCapacity} capacity`} accent="teal" />
        <StatCard icon={DollarSign} label="Total revenue" value={`EGP ${stats.totalRevenue.toLocaleString()}`} sublabel="from confirmed" accent="gold" />
        <StatCard icon={TrendingUp} label="Active camps" value={campBreakdown.length} sublabel={`of ${camps.length} total`} accent="orange" />
      </div>

      {/* Per-camp breakdown */}
      <div className="mt-12">
        <h2 className="mb-6 font-display text-xl font-bold text-foreground">Per-camp breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campBreakdown.map((c) => (
            <Link key={c.campId} href={`/portal/admin/camps/${c.campId}`} className="block rounded-2xl border border-border/60 bg-card/50 p-5 transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <span className="text-xs text-muted-foreground">{c.confirmed}/{c.capacity}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-ember" style={{ width: `${Math.min((c.confirmed / c.capacity) * 100, 100)}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{c.total} registrations</span>
                <span className="font-semibold text-foreground">EGP {c.revenue.toLocaleString()}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-primary">Open camp: analytics &amp; registrations →</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <h2 className="w-full font-display text-xl font-bold text-foreground">All registrations</h2>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Camp:</span>
          <select value={campFilter} onChange={(e) => updateParams({ camp: e.target.value })} className="min-w-0 max-w-full rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-foreground outline-none">
            <option value="all">All camps</option>
            {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Status:</span>
          <select value={statusFilter} onChange={(e) => updateParams({ status: e.target.value })} className="min-w-0 max-w-full rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-foreground outline-none">
            <option value="all">All statuses</option>
            <option value="pending_payment">Pending payment</option>
            <option value="payment_submitted">Payment submitted</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Data table */}
      <div className="mt-4">
        <AdminDataTable
          data={registrations}
          columns={columns}
          pageSize={pageSize}
          searchKeys={['camper_name', 'parent_name', 'email', 'registration_number']}
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{totalCount} total registrations.</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/60 bg-transparent" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/60 bg-transparent" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
