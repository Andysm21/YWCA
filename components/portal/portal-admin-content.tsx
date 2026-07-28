'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Users, CalendarCheck, DollarSign, TrendingUp, Download, Eye, Lock } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { AdminDataTable, type Column } from '@/components/shared/admin-data-table';
import { mockRegistrations, allCamps, seasons, type Registration } from '@/lib/camp-data';
import { useRole } from '@/components/role-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const statusBadge: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  waitlist: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

export function PortalAdminContent() {
  const router = useRouter();
  const { authed, role } = useRole();
  const [campFilter, setCampFilter] = React.useState('all');
  const [seasonFilter, setSeasonFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    if (!authed || role !== 'admin') {
      router.replace('/portal/login');
    }
  }, [authed, role, router]);

  const filteredData = React.useMemo(() => {
    return mockRegistrations.filter((r) => {
      if (campFilter !== 'all' && r.campSlug !== campFilter) return false;
      if (seasonFilter !== 'all' && !r.season.toLowerCase().includes(seasonFilter)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [campFilter, seasonFilter, statusFilter]);

  const totalReg = filteredData.length;
  const confirmedReg = filteredData.filter((r) => r.status === 'confirmed').length;
  const totalRevenue = filteredData.filter((r) => r.status === 'confirmed').reduce((sum, r) => sum + r.price, 0);
  const totalCapacity = allCamps.reduce((s, c) => s + c.capacity, 0);
  const spotsFilled = mockRegistrations.filter((r) => r.status === 'confirmed').length;

  const campBreakdown = allCamps.map((c) => {
    const regs = mockRegistrations.filter((r) => r.campSlug === c.slug);
    const confirmed = regs.filter((r) => r.status === 'confirmed').length;
    const revenue = regs.filter((r) => r.status === 'confirmed').reduce((s, r) => s + r.price, 0);
    return { name: c.name, slug: c.slug, total: regs.length, confirmed, revenue, capacity: c.capacity };
  }).filter((c) => c.total > 0);

  const columns: Column<Registration>[] = [
    { key: 'id', label: 'ID', sortable: true, render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: 'camperName', label: 'Camper', sortable: true, render: (r) => <span className="font-medium">{r.camperName}</span> },
    { key: 'campName', label: 'Camp', sortable: true },
    { key: 'season', label: 'Season', sortable: true },
    { key: 'registeredAt', label: 'Registered', sortable: true, render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> },
    { key: 'status', label: 'Payment', sortable: true, render: (r) => (
      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusBadge[r.status])}>{r.status}</span>
    ) },
    { key: 'guardianName', label: 'Guardian', sortable: true },
    { key: 'email', label: 'Contact', render: (r) => (
      <div className="text-xs">
        <p className="text-white/80">{r.email}</p>
        <p className="text-muted-foreground">{r.phone}</p>
      </div>
    ) },
  ];

  function exportCSV() {
    const headers = ['ID', 'Camper', 'Camp', 'Season', 'Age', 'Gender', 'Guardian', 'Email', 'Phone', 'Price', 'Status', 'Registered'];
    const rows = filteredData.map((r) => [r.id, r.camperName, r.campName, r.season, r.age, r.gender, r.guardianName, r.email, r.phone, r.price, r.status, r.registeredAt]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registrations.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed || role !== 'admin') {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Redirecting...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-white">Admin Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-400">
              <Lock className="h-3 w-3" /> View Only
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">Read-only overview of registrations and revenue. No actions available.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="rounded-full border-border/60 bg-card/50">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total registrations" value={totalReg} sublabel={`${confirmedReg} confirmed`} accent="orange" />
        <StatCard icon={CalendarCheck} label="Spots filled" value={spotsFilled} sublabel={`of ${totalCapacity} capacity`} accent="teal" />
        <StatCard icon={DollarSign} label="Total revenue" value={`EGP ${totalRevenue.toLocaleString()}`} sublabel="from confirmed" accent="gold" />
        <StatCard icon={TrendingUp} label="Active camps" value={campBreakdown.length} sublabel={`of ${allCamps.length} total`} accent="orange" />
      </div>

      {/* Per-camp breakdown */}
      <div className="mt-12">
        <h2 className="mb-6 font-display text-xl font-bold text-white">Per-camp breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campBreakdown.map((c) => (
            <div key={c.slug} className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{c.name}</h3>
                <span className="text-xs text-muted-foreground">{c.confirmed}/{c.capacity}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-ember" style={{ width: `${Math.min((c.confirmed / c.capacity) * 100, 100)}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{c.total} registrations</span>
                <span className="font-semibold text-white">EGP {c.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <h2 className="w-full font-display text-xl font-bold text-white">All registrations</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Camp:</span>
          <select value={campFilter} onChange={(e) => setCampFilter(e.target.value)} className="rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-white outline-none">
            <option value="all">All camps</option>
            {allCamps.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Season:</span>
          <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} className="rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-white outline-none">
            <option value="all">All seasons</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Status:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-white outline-none">
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="waitlist">Waitlist</option>
          </select>
        </div>
      </div>

      {/* Data table */}
      <div className="mt-4">
        <AdminDataTable
          data={filteredData}
          columns={columns}
          searchKeys={['camperName', 'campName', 'guardianName', 'email', 'id']}
        />
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          This dashboard is view-only. You cannot add, edit, or delete records.
        </div>
      </div>
    </div>
  );
}
