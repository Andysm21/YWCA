'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users, CalendarCheck, DollarSign, TrendingUp, Plus, Pencil, Trash2,
  Calendar, Tent, FileText, Settings, Download, ArrowRight, X, Check,
  AlertTriangle, Image as ImageIcon, Mail, MapPin, Phone, Megaphone,
} from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { AdminDataTable, type Column } from '@/components/shared/admin-data-table';
import { mockRegistrations, allCamps, seasons, newsItems, type Registration } from '@/lib/camp-data';
import { useRole } from '@/components/role-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusBadge: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  waitlist: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

type Tab = 'overview' | 'seasons' | 'camps' | 'registrations' | 'content' | 'settings';

export function PortalSuperAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authed, role } = useRole();
  const [tab, setTab] = React.useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
  const [confirmState, setConfirmState] = React.useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  React.useEffect(() => {
    if (!authed || role !== 'super-admin') {
      router.replace('/portal/login');
    }
  }, [authed, role, router]);

  function switchTab(t: Tab) {
    setTab(t);
    router.push(`/portal/super-admin?tab=${t}`);
  }

  if (!authed || role !== 'super-admin') {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Redirecting...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-white">Super Admin Dashboard</h1>
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
          ['content', 'Content', FileText],
          ['settings', 'Settings', Settings],
        ] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
              tab === t ? 'bg-gradient-to-r from-brand-orange to-brand-ember text-white shadow-[0_0_20px_-4px_hsl(22_95%_56%/0.6)]' : 'text-muted-foreground hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab onNavigate={switchTab} />}
      {tab === 'seasons' && <SeasonsTab onConfirm={setConfirmState} />}
      {tab === 'camps' && <CampsTab onConfirm={setConfirmState} />}
      {tab === 'registrations' && <RegistrationsTab onConfirm={setConfirmState} />}
      {tab === 'content' && <ContentTab onConfirm={setConfirmState} />}
      {tab === 'settings' && <SettingsTab />}

      {/* Confirmation dialog */}
      {confirmState && (
        <AlertDialog open onOpenChange={() => setConfirmState(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                {confirmState.title}
              </AlertDialogTitle>
              <AlertDialogDescription>{confirmState.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-full bg-rose-500 text-white hover:bg-rose-600"
                onClick={() => { confirmState.onConfirm(); setConfirmState(null); }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

/* ========== OVERVIEW ========== */
function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const totalReg = mockRegistrations.length;
  const confirmedReg = mockRegistrations.filter((r) => r.status === 'confirmed').length;
  const totalRevenue = mockRegistrations.filter((r) => r.status === 'confirmed').reduce((sum, r) => sum + r.price, 0);
  const totalCapacity = allCamps.reduce((s, c) => s + c.capacity, 0);

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total registrations" value={totalReg} sublabel={`${confirmedReg} confirmed`} accent="orange" />
        <StatCard icon={CalendarCheck} label="Spots filled" value={confirmedReg} sublabel={`of ${totalCapacity} capacity`} accent="teal" />
        <StatCard icon={DollarSign} label="Total revenue" value={`EGP ${totalRevenue.toLocaleString()}`} sublabel="from confirmed" accent="gold" />
        <StatCard icon={TrendingUp} label="Active camps" value={allCamps.length} sublabel={`${seasons.length} seasons`} accent="orange" />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-display text-xl font-bold text-white">Quick actions</h2>
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
                <span className="font-semibold text-white">{a.label}</span>
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
function SeasonsTab({ onConfirm }: { onConfirm: (s: { title: string; description: string; onConfirm: () => void }) => void }) {
  const [showAdd, setShowAdd] = React.useState(false);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="rounded-full glow-orange" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add New Season
        </Button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/50 p-6">
          <h3 className="mb-4 font-display text-lg font-bold text-white">Add new season</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" placeholder="2027" className="rounded-xl bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Season</Label>
              <select className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm">
                <option>Summer</option>
                <option>Winter</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" className="rounded-full" onClick={() => setShowAdd(false)}><Check className="mr-1.5 h-4 w-4" /> Create</Button>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {seasons.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary"><s.icon className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.camps.length} camps</p>
                </div>
              </div>
              <Badge className={cn('rounded-full border', s.open ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400' : 'border-sky-500/20 bg-sky-500/15 text-sky-400')}>
                {s.open ? 'Open' : 'Closed'}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{s.tagline}</p>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-full"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
              <Button size="sm" variant="outline" className="rounded-full">{s.open ? 'Close season' : 'Open season'}</Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-rose-400 hover:text-rose-300"
                onClick={() => onConfirm({
                  title: `Delete ${s.label}?`,
                  description: `This will remove the season and all ${s.camps.length} camps within it. This action cannot be undone.`,
                  onConfirm: () => {},
                })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== CAMPS ========== */
function CampsTab({ onConfirm }: { onConfirm: (s: { title: string; description: string; onConfirm: () => void }) => void }) {
  const [selectedSeason, setSelectedSeason] = React.useState('all');
  const [showAdd, setShowAdd] = React.useState(false);

  const camps = selectedSeason === 'all' ? allCamps : allCamps.filter((c) => c.season === selectedSeason);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Season:</span>
          <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm font-medium text-white outline-none">
            <option value="all">All seasons</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
          </select>
        </div>
        <Button size="sm" className="rounded-full glow-orange" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Camp
        </Button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/50 p-6">
          <h3 className="mb-4 font-display text-lg font-bold text-white">Add new camp</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2"><Label>Camp name</Label><Input placeholder="Kids Camp 5" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Start date</Label><Input type="date" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>End date</Label><Input type="date" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Age range</Label><Input placeholder="7-11" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" placeholder="80" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Price (EGP)</Label><Input type="number" placeholder="6500" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>Description</Label>
              <Input placeholder="A brief description of the camp..." className="rounded-xl bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Cover photo</Label>
              <div className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/20 text-muted-foreground hover:border-primary/40">
                <ImageIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="rounded-full" onClick={() => setShowAdd(false)}><Check className="mr-1.5 h-4 w-4" /> Create camp</Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              {['Camp', 'Season', 'Dates', 'Age', 'Spots', 'Price', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {camps.map((c) => (
              <tr key={c.id} className="border-b border-border/40 transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{c.season} {c.year}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(c.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(c.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.ageRange}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.spotsLeft}/{c.capacity}</td>
                <td className="px-4 py-3 text-muted-foreground">EGP {c.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-white"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-300"
                      onClick={() => onConfirm({
                        title: `Remove ${c.name}?`,
                        description: `This will remove the camp and all its registrations. This action cannot be undone.`,
                        onConfirm: () => {},
                      })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========== REGISTRATIONS ========== */
function RegistrationsTab({ onConfirm }: { onConfirm: (s: { title: string; description: string; onConfirm: () => void }) => void }) {
  const [showAdd, setShowAdd] = React.useState(false);

  const columns: Column<Registration>[] = [
    { key: 'id', label: 'ID', sortable: true, render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: 'camperName', label: 'Camper', sortable: true, render: (r) => <span className="font-medium">{r.camperName}</span> },
    { key: 'campName', label: 'Camp', sortable: true },
    { key: 'season', label: 'Season', sortable: true },
    { key: 'registeredAt', label: 'Registered', sortable: true, render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
    { key: 'status', label: 'Payment', sortable: true, render: (r) => (
      <select
        defaultValue={r.status}
        className="rounded-full border border-border/60 bg-card/50 px-2 py-0.5 text-xs font-semibold text-white outline-none"
      >
        <option value="confirmed">confirmed</option>
        <option value="pending">pending</option>
        <option value="waitlist">waitlist</option>
      </select>
    ) },
    { key: 'guardianName', label: 'Guardian' },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-white"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-300"
          onClick={() => onConfirm({
            title: `Cancel ${r.camperName}'s registration?`,
            description: `This will remove the registration for ${r.campName}. This action cannot be undone.`,
            onConfirm: () => {},
          })}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ) },
  ];

  function exportCSV() {
    const headers = ['ID', 'Camper', 'Camp', 'Season', 'Age', 'Gender', 'Guardian', 'Email', 'Phone', 'Price', 'Status', 'Registered'];
    const rows = mockRegistrations.map((r) => [r.id, r.camperName, r.campName, r.season, r.age, r.gender, r.guardianName, r.email, r.phone, r.price, r.status, r.registeredAt]);
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
      <div className="mb-4 flex justify-end gap-2">
        <Button onClick={exportCSV} size="sm" variant="outline" className="rounded-full border-border/60 bg-card/50">
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
        <Button size="sm" className="rounded-full glow-orange" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Registration
        </Button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/50 p-6">
          <h3 className="mb-4 font-display text-lg font-bold text-white">Add registration manually</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2"><Label>Camper name</Label><Input placeholder="Full name" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Age</Label><Input type="number" placeholder="12" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Gender</Label><select className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm"><option>Female</option><option>Male</option></select></div>
            <div className="space-y-2"><Label>Camp</Label><select className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm">{allCamps.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
            <div className="space-y-2"><Label>Guardian name</Label><Input placeholder="Parent name" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="you@example.com" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" placeholder="+20 100 000 0000" className="rounded-xl bg-background/50" /></div>
            <div className="space-y-2"><Label>Status</Label><select className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm"><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="waitlist">Waitlist</option></select></div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="rounded-full" onClick={() => setShowAdd(false)}><Check className="mr-1.5 h-4 w-4" /> Add registration</Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <AdminDataTable
        data={mockRegistrations}
        columns={columns}
        searchKeys={['camperName', 'campName', 'guardianName', 'email', 'id']}
      />
    </div>
  );
}

/* ========== CONTENT ========== */
function ContentTab({ onConfirm }: { onConfirm: (s: { title: string; description: string; onConfirm: () => void }) => void }) {
  const [section, setSection] = React.useState<'news' | 'gallery'>('news');

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-full border border-border/60 bg-card/50 p-1.5">
        {(['news', 'gallery'] as const).map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={cn('rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all',
              section === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white')}>
            {s === 'news' ? 'News & Updates' : 'Photo Gallery'}
          </button>
        ))}
      </div>

      {section === 'news' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button size="sm" className="rounded-full glow-orange"><Plus className="mr-1.5 h-4 w-4" /> Add article</Button>
          </div>
          <div className="space-y-3">
            {newsItems.map((n) => (
              <div key={n.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
                <div className={cn('h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br', n.accent === 'orange' ? 'from-brand-orange/30' : n.accent === 'teal' ? 'from-brand-teal/30' : 'from-brand-gold/30', 'to-transparent')} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {n.tag}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-white"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-300"
                  onClick={() => onConfirm({
                    title: `Delete "${n.title}"?`,
                    description: 'This news article will be permanently removed. This action cannot be undone.',
                    onConfirm: () => {},
                  })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'gallery' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button size="sm" className="rounded-full glow-orange"><Plus className="mr-1.5 h-4 w-4" /> Upload photos</Button>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-card to-card/30">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-background/70 text-rose-400"
                    onClick={() => onConfirm({
                      title: 'Delete this photo?',
                      description: 'This image will be permanently removed from the gallery. This action cannot be undone.',
                      onConfirm: () => {},
                    })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== SETTINGS ========== */
function SettingsTab() {
  return (
    <div className="max-w-2xl space-y-8">
      {/* Announcement banner */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-white">Site-wide announcement</h3>
        </div>
        <div className="space-y-2">
          <Label>Announcement text</Label>
          <Input placeholder="Summer 2026 registration is open!" className="rounded-xl bg-background/50" />
          <p className="text-xs text-muted-foreground">Leave empty to hide the banner.</p>
        </div>
      </div>

      {/* Contact info */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-white">Contact information</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Email</Label><Input defaultValue="hello@ywcacamp.org" className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+20 100 000 0000" className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input defaultValue="Ras Sedr, South Sinai, Egypt" className="rounded-xl bg-background/50" /></div>
        </div>
      </div>

      {/* Social links */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-white">Social media links</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>Facebook</Label><Input placeholder="https://facebook.com/..." className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2"><Label>Instagram</Label><Input placeholder="https://instagram.com/..." className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2"><Label>Twitter</Label><Input placeholder="https://twitter.com/..." className="rounded-xl bg-background/50" /></div>
        </div>
      </div>

      <Button size="lg" className="rounded-full glow-orange"><Check className="mr-2 h-4 w-4" /> Save settings</Button>
    </div>
  );
}
