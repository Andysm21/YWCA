'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, Search, Users, DollarSign, Clock3, TrendingUp, ClipboardCheck, ShieldAlert, FileWarning, Baby, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge, STATUS_LABELS } from '@/components/portal/status-badge';
import { CampStatusPieChart, CampFillRateBar } from '@/components/portal/camp-analytics-charts';
import { EmailStatusCell } from '@/components/portal/email-status-cell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateRange, type Camp } from '@/lib/camp-data';
import type { CampAnalytics } from '@/lib/queries/analytics';
import type { CampInsights, RegistrationRow } from '@/lib/queries/registrations';
import { cn } from '@/lib/utils';

const STATUS_ORDER = ['pending_payment', 'payment_submitted', 'confirmed', 'waitlisted', 'refunded'] as const;

function Breakdown({ title, items }: { title: string; items: [string, number][] }) {
  const max = Math.max(1, ...items.map(([, n]) => n));
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map(([label, n]) => (
            <li key={label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground/90">{label}</span>
                <span className="shrink-0 font-semibold text-foreground">{n}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-ember" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CampDetailContent({
  camp, analytics, insights, registrations, totalCount, page, pageSize, statusFilter, search,
}: {
  camp: Camp;
  analytics: CampAnalytics;
  insights: CampInsights;
  registrations: RegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  statusFilter: string;
  search: string;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState(search);
  const [navigating, startTransition] = React.useTransition();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const base = `/portal/admin/camps/${camp.id}`;

  function go(next: { status?: string; q?: string; page?: number }) {
    const params = new URLSearchParams();
    const st = next.status ?? statusFilter;
    const qq = next.q ?? search;
    if (st && st !== 'all') params.set('status', st);
    if (qq) params.set('q', qq);
    if ((next.page ?? 1) > 1) params.set('page', String(next.page));
    startTransition(() => router.push(`${base}${params.toString() ? `?${params}` : ''}`));
  }

  const exportParams = new URLSearchParams({ camp: camp.id });
  if (statusFilter !== 'all') exportParams.set('status', statusFilter);
  if (search) exportParams.set('q', search);

  const activeTotal = Object.entries(analytics.statusCounts).reduce((s, [k, n]) => (k === 'refunded' ? s : s + (n ?? 0)), 0);

  return (
    <div>
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">{camp.name}</h1>
            <span className="rounded-full border border-border/60 bg-card/50 px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground">{camp.season} {camp.year}</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">{camp.dbStatus.replace('_', ' ')}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateRange(camp.dateStart, camp.dateEnd)} · Ages {camp.ageRange} · EGP {camp.price.toLocaleString()} · Capacity {camp.capacity}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-full glow-orange">
            <a href={`/api/portal/registrations/export?${exportParams}`} download>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-border/60 bg-card/50">
            <Link href={`/camps/${camp.slug}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" /> Public page</Link>
          </Button>
        </div>
      </div>

      {/* Analytics */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <StatCard icon={Users} label="Registrations" value={activeTotal} sublabel={`${analytics.filledCount} / ${analytics.capacity} spots filled`} accent="orange" />
        <StatCard icon={DollarSign} label="Confirmed revenue" value={`EGP ${analytics.confirmedRevenueEgp.toLocaleString()}`} sublabel="verified payments" accent="teal" />
        <StatCard icon={ClipboardCheck} label="Needs review" value={analytics.statusCounts.payment_submitted ?? 0} sublabel="payment submitted" accent="gold" />
        <StatCard icon={Clock3} label="Waitlist" value={analytics.waitlistSize} sublabel="waiting for a spot" accent="gold" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-5 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Pending confirmation" value={`EGP ${analytics.pendingConfirmationRevenueEgp.toLocaleString()}`} sublabel="not counted as revenue yet" accent="orange" />
        <StatCard icon={Baby} label="First-time campers" value={insights.firstTimers} sublabel={`of ${insights.total} active`} accent="teal" />
        <StatCard icon={ShieldAlert} label="Medical notes" value={insights.withMedical} sublabel="campers with conditions" accent="orange" />
        <StatCard icon={FileWarning} label="Missing documents" value={insights.missingDocuments} sublabel="paid but no files" accent="gold" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 sm:p-6">
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Status breakdown</h2>
          <CampStatusPieChart statusCounts={analytics.statusCounts} />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 sm:p-6">
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Capacity fill</h2>
          <p className="mb-4 text-sm text-muted-foreground">{analytics.filledCount} filled / {analytics.capacity} capacity ({analytics.fillRatePct}%)</p>
          <CampFillRateBar filledCount={analytics.filledCount} capacity={analytics.capacity} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Breakdown title="By grade" items={insights.byGrade} />
        <Breakdown title="T-shirt sizes" items={insights.byTshirt} />
        <Breakdown title="Bus pickup" items={insights.byBus} />
      </div>

      {/* Registrations */}
      <div className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-foreground">Registrations for this camp</h2>
          <p className="text-sm text-muted-foreground">{totalCount} {statusFilter !== 'all' || search ? 'match' : 'total'}</p>
        </div>

        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {(['all', ...STATUS_ORDER] as const).map((s) => {
            const n = s === 'all' ? Object.values(analytics.statusCounts).reduce((a, b) => a + (b ?? 0), 0) : analytics.statusCounts[s] ?? 0;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => go({ status: s, page: 1 })}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border/60 bg-card/50 text-muted-foreground hover:text-foreground'
                )}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]} <span className={cn('ml-1 text-xs', active ? 'opacity-90' : 'opacity-70')}>{n}</span>
              </button>
            );
          })}
        </div>

        <form
          className="mt-3 flex max-w-lg gap-2"
          onSubmit={(e) => { e.preventDefault(); go({ q: q.trim(), page: 1 }); }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, reg #, school…" className="rounded-full bg-background/50 pl-9" />
          </div>
          <Button type="submit" variant="outline" className="rounded-full border-border/60 bg-card/50">Search</Button>
          {search && <Button type="button" variant="ghost" className="rounded-full" onClick={() => { setQ(''); go({ q: '', page: 1 }); }}>Clear</Button>}
        </form>

        <div className={cn('mt-4 transition-opacity', navigating && 'opacity-60')}>
          {registrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
              {navigating ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'No registrations match.'}
            </div>
          ) : (
            <>
              {/* Phones: cards */}
              <ul className="space-y-3 md:hidden">
                {registrations.map((r) => (
                  <li key={r.id}>
                    <Link href={`/portal/admin/registrations/${r.id}`} className="block rounded-2xl border border-border/60 bg-card/50 p-4 transition-colors active:bg-muted/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{r.camper_name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{r.registration_number}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <div><dt className="text-muted-foreground">Guardian</dt><dd className="truncate text-foreground/90">{r.parent_name}</dd></div>
                        <div><dt className="text-muted-foreground">Phone</dt><dd className="truncate text-foreground/90">{r.mobile_phone}</dd></div>
                        <div><dt className="text-muted-foreground">Grade</dt><dd className="truncate text-foreground/90">{r.academic_year ?? '—'}</dd></div>
                        <div><dt className="text-muted-foreground">Registered</dt><dd className="text-foreground/90">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</dd></div>
                      </dl>
                      <p className="mt-3 text-xs font-semibold text-primary">View all details &amp; documents →</p>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Tablet / desktop: table */}
              <div className="hidden overflow-x-auto rounded-2xl border border-border/60 bg-card/50 md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      {['Reg #', 'Camper', 'Status', 'Grade', 'Guardian', 'Contact', 'Email', 'Registered', ''].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => (
                      <tr key={r.id} className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.registration_number}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{r.camper_name}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-foreground/80">{r.academic_year ?? '—'}</td>
                        <td className="px-4 py-3 text-foreground/80">{r.parent_name}</td>
                        <td className="px-4 py-3 text-xs"><p className="text-foreground/80">{r.parent_email}</p><p className="text-muted-foreground">{r.mobile_phone}</p></td>
                        <td className="px-4 py-3"><EmailStatusCell registrationId={r.id} status={r.email_status} failureReason={r.email_failure_reason} /></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild size="sm" variant="outline" className="rounded-full border-border/60 bg-transparent">
                            <Link href={`/portal/admin/registrations/${r.id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 bg-transparent" disabled={page <= 1} onClick={() => go({ page: page - 1 })}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 bg-transparent" disabled={page >= totalPages} onClick={() => go({ page: page + 1 })}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
