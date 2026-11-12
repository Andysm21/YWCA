'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users, CalendarCheck, DollarSign, TrendingUp, Plus, Pencil, Trash2,
  Calendar, Tent, FileText, Settings, Download, ArrowRight, Check,
  Mail, MapPin, Megaphone, ChevronLeft, ChevronRight,
  UserPlus, Loader2, ShieldCheck, KeyRound, Copy, AlertTriangle,
} from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { EmailQuotaWidget } from '@/components/portal/email-quota-widget';
import { AdminDataTable, type Column } from '@/components/shared/admin-data-table';
import { formatDateRange, type Season, type Camp } from '@/lib/camp-data';
import { getSeasonIcon } from '@/lib/icon-map';
import type { RegistrationRow, RegistrationStatus } from '@/lib/queries/registrations';
import type { StaffUser } from '@/lib/queries/users';
import type { NewsPostRow } from '@/lib/queries/news';
import type { GalleryImageRow } from '@/lib/queries/gallery';
import type { CampTypeRow } from '@/lib/queries/camp-types';
import { validateSeasonInput } from '@/lib/validation/season';
import { validateCampInput } from '@/lib/validation/camp';
import { cn, slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ContentTab } from '@/components/portal/content-management';
import { ConfirmDialog, type ConfirmState } from '@/components/portal/confirm-dialog';
import { DEFAULT_INSTAGRAM_URL, type PublicSiteSettings } from '@/lib/site-settings-shared';
import { EmailStatusCell } from '@/components/portal/email-status-cell';
import { RegistrationActionsCell } from '@/components/portal/registration-actions-cell';

const statusBadge: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  payment_submitted: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  pending_payment: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  waitlisted: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  refunded: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

type CampBreakdown = { campId: string; name: string; slug: string; capacity: number; total: number; confirmed: number; revenue: number };

const TABS = ['overview', 'seasons', 'camps', 'registrations', 'staff', 'content', 'settings'] as const;
type Tab = (typeof TABS)[number];

type Props = {
  siteSettings: PublicSiteSettings;
  registrations: RegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  stats: { totalCount: number; confirmedCount: number; totalRevenue: number };
  campBreakdown: CampBreakdown[];
  seasons: Season[];
  camps: Camp[];
  campTypes: CampTypeRow[];
  campFilter: string;
  statusFilter: string;
  staffUsers: StaffUser[];
  newsPosts: NewsPostRow[];
  newsTotalCount: number;
  newsPage: number;
  galleryImages: GalleryImageRow[];
  galleryTotalCount: number;
  galleryPage: number;
  emailUsage: { sentToday: number; estimatedQuota: number };
};

export function PortalSuperAdminContent(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The URL is the single source of truth for the active tab, so sidebar links
  // (which only change ?tab=) and the in-page tab bar always stay in sync.
  const rawTab = searchParams.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? '') ? (rawTab as Tab) : 'overview';
  const [confirmState, setConfirmState] = React.useState<ConfirmState>(null);

  function switchTab(t: Tab) {
    router.push(`/portal/super-admin?tab=${t}`);
  }

  const totalCapacity = props.camps.reduce((s, c) => s + c.capacity, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-foreground">Super Admin Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Check className="h-3 w-3" /> Full Access
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">Manage seasons, camps, registrations, content, and settings.</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-8 flex flex-wrap gap-1 rounded-full border border-border/60 bg-card/50 p-1.5">
        {([
          ['overview', 'Overview', TrendingUp],
          ['seasons', 'Seasons', Calendar],
          ['camps', 'Camps', Tent],
          ['registrations', 'Registrations', Users],
          ['staff', 'Staff', UserPlus],
          ['content', 'Content', FileText],
          ['settings', 'Settings', Settings],
        ] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
              tab === t ? 'bg-gradient-to-r from-brand-orange to-brand-ember text-white shadow-[0_0_20px_-4px_hsl(22_95%_56%/0.6)]' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab onNavigate={switchTab} stats={props.stats} totalCapacity={totalCapacity} campCount={props.camps.length} seasonCount={props.seasons.length} emailUsage={props.emailUsage} />}
      {tab === 'seasons' && <SeasonsTab seasons={props.seasons} onConfirm={setConfirmState} />}
      {tab === 'camps' && <CampsTab camps={props.camps} seasons={props.seasons} campTypes={props.campTypes} campBreakdown={props.campBreakdown} onConfirm={setConfirmState} />}
      {tab === 'registrations' && (
        <RegistrationsTab
          registrations={props.registrations}
          totalCount={props.totalCount}
          page={props.page}
          pageSize={props.pageSize}
          camps={props.camps}
          campFilter={props.campFilter}
          statusFilter={props.statusFilter}
          onConfirm={setConfirmState}
        />
      )}
      {tab === 'staff' && <StaffTab staffUsers={props.staffUsers} onConfirm={setConfirmState} />}
      {tab === 'content' && (
        <ContentTab
          seasons={props.seasons}
          camps={props.camps}
          newsPosts={props.newsPosts}
          newsTotalCount={props.newsTotalCount}
          newsPage={props.newsPage}
          galleryImages={props.galleryImages}
          galleryTotalCount={props.galleryTotalCount}
          galleryPage={props.galleryPage}
          basePath="/portal/super-admin"
          onConfirm={setConfirmState}
        />
      )}
      {tab === 'settings' && <SettingsTab initial={props.siteSettings} />}

      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

/* ========== OVERVIEW ========== */
function OverviewTab({
  onNavigate, stats, totalCapacity, campCount, seasonCount, emailUsage,
}: {
  onNavigate: (t: Tab) => void;
  stats: { totalCount: number; confirmedCount: number; totalRevenue: number };
  totalCapacity: number;
  campCount: number;
  seasonCount: number;
  emailUsage: { sentToday: number; estimatedQuota: number };
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        <StatCard icon={Users} label="Total registrations" value={stats.totalCount} sublabel={`${stats.confirmedCount} confirmed`} accent="orange" />
        <StatCard icon={CalendarCheck} label="Spots filled" value={stats.confirmedCount} sublabel={`of ${totalCapacity} capacity`} accent="teal" />
        <StatCard icon={DollarSign} label="Total revenue" value={`EGP ${stats.totalRevenue.toLocaleString()}`} sublabel="from confirmed" accent="gold" />
        <StatCard icon={TrendingUp} label="Active camps" value={campCount} sublabel={`${seasonCount} seasons`} accent="orange" />
      </div>

      <div className="mt-6">
        <EmailQuotaWidget sentToday={emailUsage.sentToday} estimatedQuota={emailUsage.estimatedQuota} />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-display text-xl font-bold text-foreground">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Add new season', icon: Calendar, tab: 'seasons' as Tab },
            { label: 'Add new camp', icon: Tent, tab: 'camps' as Tab },
            { label: 'Manage registrations', icon: Users, tab: 'registrations' as Tab },
            { label: 'Add news post', icon: FileText, tab: 'content' as Tab },
            { label: 'Edit settings', icon: Settings, tab: 'settings' as Tab },
            { label: 'Export data', icon: Download, tab: 'registrations' as Tab },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.tab)}
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <a.icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-foreground">{a.label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== SEASONS ========== */
function SeasonsTab({ seasons, onConfirm }: { seasons: Season[]; onConfirm: (s: { title: string; description: string; onConfirm: () => void }) => void }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const [year, setYear] = React.useState(String(new Date().getFullYear() + 1));
  const [type, setType] = React.useState<'summer' | 'winter'>('summer');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const sorted = [...seasons].sort((a, b) => b.year - a.year || a.type.localeCompare(b.type));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = validateSeasonInput({ year, type });
    if (errors.length > 0) {
      setFormError(errors.join(' '));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/portal/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: Number(year), type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create season');
      setShowAdd(false);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create season');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(s: Season) {
    setTogglingId(s.id);
    try {
      const nextStatus = s.dbStatus === 'open' ? 'closed' : 'open';
      const res = await fetch(`/api/portal/seasons/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update season');
      router.refresh();
    } catch (err) {
      onConfirm({
        title: 'Failed to update season',
        description: err instanceof Error ? err.message : 'Unknown error',
        onConfirm: () => {},
      });
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sorted.length} season{sorted.length === 1 ? '' : 's'}, newest first.</p>
        <Button size="sm" className="rounded-full glow-orange" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add New Season
        </Button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/50 p-6">
          <h3 className="mb-4 font-display text-lg font-bold text-foreground">Add new season</h3>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="rounded-xl bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Season</Label>
              <select value={type} onChange={(e) => setType(e.target.value as 'summer' | 'winter')} className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm">
                <option value="summer">Summer</option>
                <option value="winter">Winter</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm" className="rounded-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />} Create
              </Button>
              <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
            {formError && <p className="text-sm text-rose-400 sm:col-span-3">{formError}</p>}
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((s) => {
          const Icon = getSeasonIcon(s.iconName);
          return (
          <div key={s.id} className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary"><Icon className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.camps.length} camps</p>
                </div>
              </div>
              <Badge className={cn('rounded-full border capitalize', s.dbStatus === 'open' ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400' : s.dbStatus === 'draft' ? 'border-sky-500/20 bg-sky-500/15 text-sky-400' : 'border-zinc-500/20 bg-zinc-500/15 text-zinc-400')}>
                {s.dbStatus}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-full" disabled={togglingId === s.id} onClick={() => toggleStatus(s)}>
                {togglingId === s.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {s.dbStatus === 'open' ? 'Close season' : 'Open season'}
              </Button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== CAMPS ========== */
const emptyCampForm = {
  season_id: '', camp_type_id: '', slug: '', age_min: '7', age_max: '11', price_egp: '',
  capacity: '48', date_start: '', date_end: '', description: '', cover_photo_url: '', dob_min: '', dob_max: '',
};
type CampFormState = typeof emptyCampForm;

function CampForm({
  seasons, camps, campTypes, initial, campBreakdownById, onCancel, onSaved,
}: {
  seasons: Season[];
  /** Existing camps — used to figure out which camp types are already taken per season. */
  camps: Camp[];
  campTypes: CampTypeRow[];
  /** `campTypeName` is display-only (edit mode shows the locked type as text, not a dropdown). */
  initial: (CampFormState & { id: string; campTypeName: string }) | null;
  campBreakdownById: Map<string, CampBreakdown>;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<CampFormState>(initial ?? emptyCampForm);
  const [slugTouched, setSlugTouched] = React.useState(!!initial);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  function set<K extends keyof CampFormState>(key: K, value: CampFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedSeason = seasons.find((s) => s.id === form.season_id) ?? null;

  // Camp types already used in the selected season (respects the DB's
  // (season_id, camp_type_id) UNIQUE constraint) — excluded from the
  // dropdown so Super Admin can't even attempt a duplicate.
  const usedTypeIds = React.useMemo(
    () => new Set(camps.filter((c) => c.seasonId === form.season_id).map((c) => c.campTypeId)),
    [camps, form.season_id]
  );

  const availableCampTypes = React.useMemo(() => {
    if (!selectedSeason) return [];
    return campTypes.filter((ct) =>
      (ct.applicable_season_type === 'both' || ct.applicable_season_type === selectedSeason.type)
      && !usedTypeIds.has(ct.id)
    );
  }, [campTypes, selectedSeason, usedTypeIds]);

  function handleSeasonChange(seasonId: string) {
    setForm((f) => ({ ...f, season_id: seasonId, camp_type_id: '' }));
  }

  function handleCampTypeChange(campTypeId: string) {
    const type = availableCampTypes.find((ct) => ct.id === campTypeId);
    setForm((f) => {
      const next = { ...f, camp_type_id: campTypeId };
      if (type && selectedSeason && !slugTouched) {
        next.slug = `${slugify(type.name)}-${selectedSeason.year}`;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateCampInput(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const res = await fetch(initial ? `/api/portal/camps/${initial.id}` : '/api/portal/camps', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save camp');
      onSaved();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save camp']);
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Birth-date range matching the min/max age, counted as of the camp start date
   * (or today when no start date is set yet).
   */
  function suggestDobRange() {
    const aMin = parseInt(form.age_min, 10);
    const aMax = parseInt(form.age_max, 10);
    if (!Number.isInteger(aMin) || !Number.isInteger(aMax) || aMin < 0 || aMax < aMin) {
      setErrors(['Enter a valid Min age and Max age first.']);
      return;
    }
    setErrors([]);
    const parsed = form.date_start ? new Date(form.date_start) : null;
    const ref = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // Youngest allowed camper: exactly Min age on the reference date -> latest birth date.
    const latest = new Date(ref.getFullYear() - aMin, ref.getMonth(), ref.getDate());
    // Oldest allowed camper: still Max age (turns Max+1 the day after) -> earliest birth date.
    const earliest = new Date(ref.getFullYear() - aMax - 1, ref.getMonth(), ref.getDate() + 1);
    setForm((f) => ({ ...f, dob_min: fmt(earliest), dob_max: fmt(latest) }));
  }

  const existingRegCount = initial ? campBreakdownById.get(initial.id)?.total ?? 0 : 0;

  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-card/50 p-6">
      <h3 className="mb-4 font-display text-lg font-bold text-foreground">{initial ? `Edit ${initial.campTypeName}` : 'Add new camp'}</h3>
      {initial && existingRegCount > 0 && (
        <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          This camp has {existingRegCount} existing registration{existingRegCount === 1 ? '' : 's'} — capacity/date changes won't affect them, but consider the impact before shrinking capacity below the current count.
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <Label>Season</Label>
          <select
            value={form.season_id}
            onChange={(e) => handleSeasonChange(e.target.value)}
            disabled={!!initial}
            className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm disabled:opacity-60"
          >
            <option value="">Select a season</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Camp type</Label>
          {initial ? (
            <div className="flex h-10 items-center rounded-xl border border-input bg-background/30 px-3 text-sm text-muted-foreground">
              {initial.campTypeName} <span className="ml-2 text-xs">(locked after creation)</span>
            </div>
          ) : !form.season_id ? (
            <div className="flex h-10 items-center rounded-xl border border-input bg-background/30 px-3 text-sm text-muted-foreground">
              Select a season first
            </div>
          ) : availableCampTypes.length === 0 ? (
            <div className="flex h-10 items-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-sm text-amber-400">
              All camp types already added to this season
            </div>
          ) : (
            <select value={form.camp_type_id} onChange={(e) => handleCampTypeChange(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm">
              <option value="">Select a camp type</option>
              {availableCampTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <Label>Slug</Label>
          <Input placeholder="kids-1-2026" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} className="rounded-xl bg-background/50" />
        </div>
        <div className="space-y-2"><Label>Start date</Label><Input type="date" value={form.date_start} onChange={(e) => set('date_start', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="space-y-2"><Label>End date</Label><Input type="date" value={form.date_end} onChange={(e) => set('date_end', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="space-y-2"><Label>Min age</Label><Input type="number" value={form.age_min} onChange={(e) => set('age_min', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="space-y-2"><Label>Max age</Label><Input type="number" value={form.age_max} onChange={(e) => set('age_max', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="space-y-2"><Label>Price (EGP)</Label><Input type="number" value={form.price_egp} onChange={(e) => set('price_egp', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="space-y-2"><Label>Earliest birth date (min)</Label><Input type="date" value={form.dob_min} onChange={(e) => set('dob_min', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="space-y-2"><Label>Latest birth date (max)</Label><Input type="date" value={form.dob_max} onChange={(e) => set('dob_max', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="flex flex-col justify-end space-y-2">
          <Button type="button" variant="outline" size="sm" className="rounded-full border-border/60 bg-transparent" onClick={suggestDobRange}>Suggest from ages</Button>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
          Optional. On the registration form, birth dates before the earliest or after the latest date are disabled. Suggest from ages fills both from the Min and Max age (counted at the camp start date, or today if no start date is set). Leave empty for no limit.
        </p>
        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <Label>Description</Label>
          <Input placeholder="A brief description of the camp..." value={form.description} onChange={(e) => set('description', e.target.value)} className="rounded-xl bg-background/50" />
        </div>
        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <Label>Cover photo URL</Label>
          <Input placeholder="https://... (file upload is a separate future task)" value={form.cover_photo_url} onChange={(e) => set('cover_photo_url', e.target.value)} className="rounded-xl bg-background/50" />
        </div>

        {errors.length > 0 && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400 sm:col-span-2 lg:col-span-3">
            {errors.map((err, i) => <p key={i}>{err}</p>)}
          </div>
        )}

        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" size="sm" className="rounded-full" disabled={submitting || (!initial && !form.camp_type_id)}>
            {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />} {initial ? 'Save changes' : 'Create camp'}
          </Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function CampsTab({
  camps, seasons, campTypes, campBreakdown, onConfirm,
}: {
  camps: Camp[];
  seasons: Season[];
  campTypes: CampTypeRow[];
  campBreakdown: CampBreakdown[];
  onConfirm: (s: { title: string; description: string; onConfirm: () => void }) => void;
}) {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = React.useState('all');
  const [showAdd, setShowAdd] = React.useState(false);
  const [editingCamp, setEditingCamp] = React.useState<Camp | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const campBreakdownById = React.useMemo(() => new Map(campBreakdown.map((c) => [c.campId, c])), [campBreakdown]);
  const filtered = selectedSeason === 'all' ? camps : camps.filter((c) => c.season === selectedSeason);

  function handleSaved() {
    setShowAdd(false);
    setEditingCamp(null);
    router.refresh();
  }

  async function handleDelete(c: Camp, force: boolean) {
    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/portal/camps/${c.id}${force ? '?force=true' : ''}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete camp');
      router.refresh();
    } catch (err) {
      onConfirm({ title: 'Could not delete camp', description: err instanceof Error ? err.message : 'Unknown error', onConfirm: () => {} });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Season:</span>
          <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="min-w-0 max-w-full rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-foreground outline-none">
            <option value="all">All seasons</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
          </select>
        </div>
        <Button size="sm" className="rounded-full glow-orange" onClick={() => { setEditingCamp(null); setShowAdd((v) => !v); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Camp
        </Button>
      </div>

      {showAdd && (
        <CampForm seasons={seasons} camps={camps} campTypes={campTypes} initial={null} campBreakdownById={campBreakdownById} onCancel={() => setShowAdd(false)} onSaved={handleSaved} />
      )}
      {editingCamp && (
        <CampForm
          seasons={seasons}
          camps={camps}
          campTypes={campTypes}
          initial={{
            id: editingCamp.id,
            season_id: editingCamp.seasonId,
            camp_type_id: editingCamp.campTypeId,
            campTypeName: editingCamp.name,
            slug: editingCamp.slug,
            age_min: String(editingCamp.ageMin),
            age_max: String(editingCamp.ageMax),
            price_egp: String(editingCamp.price),
            capacity: String(editingCamp.capacity),
            date_start: editingCamp.dateStart,
            date_end: editingCamp.dateEnd,
            description: editingCamp.description,
            cover_photo_url: editingCamp.coverPhotoUrl ?? '',
            dob_min: editingCamp.dobMin ?? '',
            dob_max: editingCamp.dobMax ?? '',
          }}
          campBreakdownById={campBreakdownById}
          onCancel={() => setEditingCamp(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              {['Camp', 'Season', 'Dates', 'Age', 'Spots', 'Price', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const regCount = campBreakdownById.get(c.id)?.total ?? 0;
              return (
                <tr key={c.id} className="border-b border-border/40 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{c.season} {c.year}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateRange(c.dateStart, c.dateEnd)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.ageRange}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.spotsLeft}/{c.capacity}</td>
                  <td className="px-4 py-3 text-muted-foreground">EGP {c.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => { setShowAdd(false); setEditingCamp(c); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={deletingId === c.id}
                        className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-300 disabled:text-muted-foreground/40"
                        onClick={() => onConfirm({
                          title: `Delete ${c.name}?`,
                          description: regCount > 0
                            ? `WARNING: this camp has ${regCount} registration${regCount === 1 ? '' : 's'}. Deleting it will also permanently delete ${regCount === 1 ? 'that registration' : `all ${regCount} registrations`} linked to it. This cannot be undone.`
                            : 'This will permanently remove the camp. This action cannot be undone.',
                          onConfirm: () => handleDelete(c, regCount > 0),
                        })}
                      >
                        {deletingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========== REGISTRATIONS ========== */
function RegistrationsTab({
  registrations, totalCount, page, pageSize, camps, campFilter, statusFilter, onConfirm,
}: {
  registrations: RegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  camps: Camp[];
  campFilter: string;
  statusFilter: string;
  onConfirm: (s: { title: string; description: string; onConfirm: () => void }) => void;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams({ tab: 'registrations', camp: campFilter, status: statusFilter, page: '1', ...next });
    router.push(`/portal/super-admin?${params.toString()}`);
  }

  const columns: Column<RegistrationRow>[] = [
    { key: 'registration_number', label: 'Reg #', sortable: true, render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.registration_number}</span> },
    { key: 'camper_name', label: 'Camper', sortable: true, render: (r) => <span className="font-medium">{r.camper_name}</span> },
    { key: 'camps', label: 'Camp', render: (r) => r.camps?.name ?? '—' },
    { key: 'created_at', label: 'Registered', sortable: true, render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => (
      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusBadge[r.status])}>{r.status.replace('_', ' ')}</span>
    ) },
    { key: 'parent_name', label: 'Guardian' },
    { key: 'email_status', label: 'Email', render: (r) => (
      <EmailStatusCell registrationId={r.id} status={r.email_status} failureReason={r.email_failure_reason} />
    ) },
    { key: 'actions', label: 'Actions', render: (r) => (
      <RegistrationActionsCell registration={r} onConfirm={onConfirm} />
    ) },
  ];

  function exportCSV() {
    const headers = ['Reg #', 'Camper', 'Camp', 'Status', 'Birth date', 'Grade', 'T-shirt', 'Bus pickup', 'Guardian', 'Email', 'Phone', 'Registered'];
    const rows = registrations.map((r) => [r.registration_number, r.camper_name, r.camps?.name ?? '', r.status, r.date_of_birth ?? '', r.academic_year ?? '', r.tshirt_size ?? '', r.bus_pickup ?? '', r.parent_name, r.email, r.mobile_phone, r.created_at]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registrations.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Camp:</span>
          <select value={campFilter} onChange={(e) => updateParams({ camp: e.target.value })} className="min-w-0 max-w-full rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-foreground outline-none">
            <option value="all">All camps</option>
            {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => updateParams({ status: e.target.value })} className="min-w-0 max-w-full rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-foreground outline-none">
            <option value="all">All statuses</option>
            <option value="pending_payment">Pending payment</option>
            <option value="payment_submitted">Payment submitted</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} size="sm" variant="outline" className="rounded-full border-border/60 bg-card/50">
            <Download className="mr-1.5 h-4 w-4" /> Export page CSV
          </Button>
          <Button size="sm" className="rounded-full glow-orange" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Registration
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/50 p-6">
          <h3 className="mb-4 font-display text-lg font-bold text-foreground">Add registration manually</h3>
          <p className="text-sm text-muted-foreground">Manual registration entry isn't wired to the live DB yet — deferred alongside the other mutation actions in this tab.</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setShowAdd(false)}>Close</Button>
          </div>
        </div>
      )}

      <AdminDataTable
        data={registrations}
        columns={columns}
        pageSize={pageSize}
        searchKeys={['camper_name', 'parent_name', 'email', 'registration_number']}
      />
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/60 bg-transparent" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/60 bg-transparent" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ========== STAFF ========== */
function StaffTab({ staffUsers, onConfirm }: { staffUsers: StaffUser[]; onConfirm: (s: { title: string; description: string; onConfirm: () => void }) => void }) {
  const router = useRouter();
  const [creationMode, setCreationMode] = React.useState<'invite' | 'direct'>('invite');
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(null);

  // Direct-creation form state
  const [directFullName, setDirectFullName] = React.useState('');
  const [directUsername, setDirectUsername] = React.useState('');
  const [directRecoveryEmail, setDirectRecoveryEmail] = React.useState('');
  const [directPassword, setDirectPassword] = React.useState('');
  const [directSubmitting, setDirectSubmitting] = React.useState(false);
  const [directError, setDirectError] = React.useState<string | null>(null);
  // One-time reveal — the password only ever lives here, never persisted
  // or refetched. Cleared the moment the Super Admin dismisses the panel.
  const [createdCreds, setCreatedCreds] = React.useState<{ username: string; password: string } | null>(null);

  async function setStaffStatus(u: StaffUser, status: 'active' | 'inactive') {
    setStatusUpdatingId(u.id);
    try {
      const res = await fetch(`/api/portal/staff/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update staff status');
      router.refresh();
    } catch (err) {
      onConfirm({
        title: 'Failed to update staff status',
        description: err instanceof Error ? err.message : 'Unknown error',
        onConfirm: () => {},
      });
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch('/api/portal/invite-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');
      setSuccess(`Invite sent to ${email}.`);
      setEmail('');
      setFullName('');
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Invite is taking too long (20s+) — likely the SMTP connection to Gmail is hanging. Check the SMTP settings in the Supabase dashboard.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send invite');
      }
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  async function handleDirectCreate(e: React.FormEvent) {
    e.preventDefault();
    setDirectSubmitting(true);
    setDirectError(null);
    try {
      const res = await fetch('/api/portal/staff/create-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: directFullName,
          username: directUsername,
          recoveryEmail: directRecoveryEmail,
          password: directPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      // Show the one-time reveal BEFORE clearing the password field — this
      // is the only moment it will ever be visible again.
      setCreatedCreds({ username: directUsername.trim().toLowerCase(), password: directPassword });
      setDirectFullName('');
      setDirectUsername('');
      setDirectRecoveryEmail('');
      setDirectPassword('');
      router.refresh();
    } catch (err) {
      setDirectError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setDirectSubmitting(false);
    }
  }

  return (
    <div>
      {createdCreds && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-400" />
            <h3 className="font-display text-lg font-bold text-foreground">Account created — save these now</h3>
          </div>
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            This password is shown ONLY this one time and cannot be retrieved later. Relay it securely (WhatsApp, in person) then dismiss this panel.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-background/60 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="text-sm font-semibold text-foreground">{createdCreds.username}</code>
                <button type="button" onClick={() => navigator.clipboard.writeText(createdCreds.username)} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-background/60 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Password</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="text-sm font-semibold text-foreground">{createdCreds.password}</code>
                <button type="button" onClick={() => navigator.clipboard.writeText(createdCreds.password)} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => setCreatedCreds(null)}>
            I've saved this, dismiss
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setCreationMode('invite')}
            className={cn('rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              creationMode === 'invite' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:text-foreground')}
          >
            Invite by Email
          </button>
          <button
            type="button"
            onClick={() => setCreationMode('direct')}
            className={cn('rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              creationMode === 'direct' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:text-foreground')}
          >
            Create with Username
          </button>
        </div>

        {creationMode === 'invite' ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold text-foreground">Invite Admin</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Sends a Supabase Auth invite email (via Supabase's built-in email service) and creates the staff record with the <span className="font-semibold text-foreground">admin</span> role.
            </p>
            <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staffFullName">Full name</Label>
                <Input id="staffFullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl bg-background/50" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffEmail">Email</Label>
                <Input id="staffEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl bg-background/50" placeholder="jane@ywcacamp.org" />
              </div>
              {error && <p className="text-sm text-rose-400 sm:col-span-2">{error}</p>}
              {success && <p className="text-sm text-emerald-400 sm:col-span-2">{success}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" className="rounded-full glow-orange" disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending invite...</> : <><UserPlus className="mr-2 h-4 w-4" /> Invite Admin</>}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold text-foreground">Create Admin Directly</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              No invite/acceptance step — the account is active immediately with the password you set here. The recovery email is used ONLY for password resets, never for login.
            </p>
            <form onSubmit={handleDirectCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="directFullName">Full name</Label>
                <Input id="directFullName" required value={directFullName} onChange={(e) => setDirectFullName(e.target.value)} className="rounded-xl bg-background/50" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="directUsername">Username</Label>
                <Input id="directUsername" required value={directUsername} onChange={(e) => setDirectUsername(e.target.value)} className="rounded-xl bg-background/50" placeholder="jane.doe" pattern="(?=.{3,30}$)[a-zA-Z0-9]+([._][a-zA-Z0-9]+)*" title="3-30 characters: letters and numbers, with dots or underscores between them" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="directRecoveryEmail">Recovery email (optional)</Label>
                <Input id="directRecoveryEmail" type="email" value={directRecoveryEmail} onChange={(e) => setDirectRecoveryEmail(e.target.value)} className="rounded-xl bg-background/50" placeholder="jane@personal-email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="directPassword">Password</Label>
                <Input id="directPassword" type="text" required minLength={8} value={directPassword} onChange={(e) => setDirectPassword(e.target.value)} className="rounded-xl bg-background/50 font-mono" placeholder="At least 8 characters" />
              </div>
              {directError && <p className="text-sm text-rose-400 sm:col-span-2">{directError}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" className="rounded-full glow-orange" disabled={directSubmitting}>
                  {directSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : <><KeyRound className="mr-2 h-4 w-4" /> Create Admin</>}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>

      <div className="mt-8">
        <h3 className="mb-4 font-display text-lg font-bold text-foreground">Staff accounts</h3>
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                {['Name', 'Login ID', 'Recovery Email', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffUsers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No staff accounts yet.</td></tr>
              ) : staffUsers.map((u) => (
                <tr key={u.id} className="border-b border-border/40 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{u.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.username ? (
                      <span className="inline-flex items-center gap-1"><KeyRound className="h-3 w-3 text-muted-foreground" />{u.username}</span>
                    ) : u.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.recovery_email ?? <span className="text-xs">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      u.role === 'super_admin' ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400' : 'border-sky-500/20 bg-sky-500/15 text-sky-400')}>
                      {u.role === 'super_admin' && <ShieldCheck className="h-3 w-3" />}
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      u.status === 'active' ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                        : u.status === 'inactive' ? 'border-zinc-500/20 bg-zinc-500/15 text-zinc-400'
                        : 'border-amber-500/20 bg-amber-500/15 text-amber-400')}>
                      {u.status === 'active' ? 'Active' : u.status === 'inactive' ? 'Inactive' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : u.status === 'inactive' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={statusUpdatingId === u.id}
                        className="rounded-full"
                        onClick={() => setStaffStatus(u, 'active')}
                      >
                        {statusUpdatingId === u.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={statusUpdatingId === u.id}
                        className="rounded-full text-rose-400 hover:text-rose-300"
                        onClick={() => onConfirm({
                          title: `Deactivate ${u.full_name}?`,
                          description: 'This immediately blocks them from signing in to the portal. You can reactivate them later.',
                          onConfirm: () => setStaffStatus(u, 'inactive'),
                        })}
                      >
                        {statusUpdatingId === u.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                        Deactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
/* ========== SETTINGS ========== */
function SettingsTab({ initial }: { initial: PublicSiteSettings }) {
  const router = useRouter();
  const [form, setForm] = React.useState<PublicSiteSettings>({ ...initial, instagram: initial.instagram || DEFAULT_INSTAGRAM_URL });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const set = (k: keyof PublicSiteSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/portal/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-8">
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">Site-wide announcement</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="set-announcement">Announcement text</Label>
          <Input id="set-announcement" value={form.announcement} onChange={set('announcement')} maxLength={200} placeholder="e.g. Registration is open!" className="rounded-xl bg-background/50" />
          <p className="text-xs text-muted-foreground">Shown as a banner on every public page. Leave empty to hide it.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="mb-1 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">Contact information</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Shown in the website footer. Fields you leave empty are not shown; if all are empty, the contact section is hidden.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="set-email">Email</Label><Input id="set-email" type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2"><Label htmlFor="set-phone">Phone</Label><Input id="set-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+20 ..." className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="set-address">Address</Label><Input id="set-address" value={form.address} onChange={set('address')} maxLength={200} placeholder="Optional" className="rounded-xl bg-background/50" /></div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="mb-1 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">Social media links</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Only links you fill in appear as icons in the footer. Use the full address, starting with https://</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="set-facebook">Facebook</Label><Input id="set-facebook" type="url" value={form.facebook} onChange={set('facebook')} placeholder="https://facebook.com/..." className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2"><Label htmlFor="set-instagram">Instagram</Label><Input id="set-instagram" type="url" value={form.instagram} onChange={set('instagram')} placeholder="https://instagram.com/..." className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2"><Label htmlFor="set-twitter">Twitter</Label><Input id="set-twitter" type="url" value={form.twitter} onChange={set('twitter')} placeholder="https://twitter.com/..." className="rounded-xl bg-background/50" /></div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {saved && <p className="text-sm text-emerald-400">Settings saved. The website will update within a few seconds.</p>}
      <Button type="submit" size="lg" className="rounded-full glow-orange" disabled={saving}>
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Check className="mr-2 h-4 w-4" /> Save settings</>}
      </Button>
    </form>
  );
}
