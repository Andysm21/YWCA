'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tent, LayoutDashboard, Calendar, Users, FileText, Settings, LogOut, Home, UserPlus, ChevronsLeft, ChevronsRight, BarChart3 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { cn } from '@/lib/utils';

const adminLinks = [
  { label: 'Dashboard', href: '/portal/admin', icon: LayoutDashboard, tab: null },
  { label: 'Analytics', href: '/portal/admin/analytics', icon: BarChart3, tab: null },
  { label: 'Content', href: '/portal/admin/content', icon: FileText, tab: null },
];

const superAdminLinks = [
  { label: 'Overview', href: '/portal/super-admin', icon: LayoutDashboard, tab: 'overview' },
  { label: 'Analytics', href: '/portal/admin/analytics', icon: BarChart3, tab: null },
  { label: 'Seasons', href: '/portal/super-admin?tab=seasons', icon: Calendar, tab: 'seasons' },
  { label: 'Camps', href: '/portal/super-admin?tab=camps', icon: Tent, tab: 'camps' },
  { label: 'Registrations', href: '/portal/super-admin?tab=registrations', icon: Users, tab: 'registrations' },
  { label: 'Staff', href: '/portal/super-admin?tab=staff', icon: UserPlus, tab: 'staff' },
  { label: 'Content', href: '/portal/super-admin?tab=content', icon: FileText, tab: 'content' },
  { label: 'Settings', href: '/portal/super-admin?tab=settings', icon: Settings, tab: 'settings' },
];

export function PortalSidebar({ mobileOpen = false, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  // Analytics lives under /portal/admin/* but is shared by both roles (see
  // middleware.ts's carve-out) — the URL alone can't tell a super_admin
  // apart from an admin there, so resolve the real role for that one
  // ambiguous case instead of guessing from the path.
  const [resolvedRole, setResolvedRole] = React.useState<'admin' | 'super_admin' | null>(null);
  const isAmbiguousAnalyticsPath = pathname.startsWith('/portal/admin/analytics');

  React.useEffect(() => {
    if (!isAmbiguousAnalyticsPath) return;
    const supabase = createClient();
    supabase.rpc('current_staff_role').then(({ data }) => setResolvedRole(data ?? null));
  }, [isAmbiguousAnalyticsPath]);

  const isSuperAdmin = isAmbiguousAnalyticsPath
    ? resolvedRole === 'super_admin'
    : pathname.startsWith('/portal/super-admin');
  const links = isSuperAdmin ? superAdminLinks : adminLinks;
  const currentTab = searchParams.get('tab') ?? 'overview';

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/portal/login');
    router.refresh();
  }

  // The collapse mode only applies to the desktop sidebar; the mobile drawer is always full width.
  const wide = !collapsed || mobileOpen;

  return (
    <>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />}
    <aside className={cn(
      'z-50 flex shrink-0 flex-col border-r border-border/60 bg-card transition-all duration-200 lg:bg-card/40 lg:backdrop-blur-sm',
      'fixed inset-y-0 left-0 h-[100dvh] w-64 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
      mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
      !wide ? 'lg:w-[72px]' : 'lg:w-64'
    )}>
      <div className={cn('flex items-center gap-2.5 border-b border-border/60 px-4 py-5', !wide && 'justify-center px-2')}>
        <Logo size="sm" className="shrink-0" />
        {!!wide && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-foreground">YWCA Camp</p>
            <p className="truncate text-xs text-muted-foreground">Staff Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((l) => {
          const basePath = l.href.split('?')[0];
          const active = pathname === basePath && (l.tab === null || l.tab === currentTab);
          return (
            <Link
              key={l.label}
              href={l.href}
              onClick={onMobileClose}
              title={!wide ? l.label : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                !wide && 'justify-center px-0',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              <l.icon className="h-4 w-4 shrink-0" />
              {!!wide && <span className="truncate">{l.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border/60 p-3">
        <div className={cn('flex items-center gap-1', !wide ? 'flex-col' : 'justify-between px-1')}>
          {!!wide && <span className="text-xs font-medium text-muted-foreground">Theme</span>}
          <ModeToggle />
        </div>

        <Link
          href="/"
          title={!wide ? 'Back to site' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground',
            !wide && 'justify-center px-0'
          )}
        >
          <Home className="h-4 w-4 shrink-0" />
          {!!wide && 'Back to site'}
        </Link>
        <button
          onClick={handleLogout}
          title={!wide ? 'Sign out' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10',
            !wide && 'justify-center px-0'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!!wide && 'Sign out'}
        </button>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            'hidden w-full lg:flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground',
            !wide && 'justify-center px-0'
          )}
        >
          {!wide ? <ChevronsRight className="h-4 w-4 shrink-0" /> : <ChevronsLeft className="h-4 w-4 shrink-0" />}
          {!!wide && 'Collapse'}
        </button>
      </div>
    </aside>
    </>
  );
}
