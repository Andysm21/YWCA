'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tent, LayoutDashboard, Calendar, Users, FileText, Settings, LogOut, Home } from 'lucide-react';
import { useRole } from '@/components/role-context';
import { cn } from '@/lib/utils';

const adminLinks = [
  { label: 'Dashboard', href: '/portal/admin', icon: LayoutDashboard },
];

const superAdminLinks = [
  { label: 'Overview', href: '/portal/super-admin', icon: LayoutDashboard },
  { label: 'Seasons', href: '/portal/super-admin?tab=seasons', icon: Calendar },
  { label: 'Camps', href: '/portal/super-admin?tab=camps', icon: Tent },
  { label: 'Registrations', href: '/portal/super-admin?tab=registrations', icon: Users },
  { label: 'Content', href: '/portal/super-admin?tab=content', icon: FileText },
  { label: 'Settings', href: '/portal/super-admin?tab=settings', icon: Settings },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { role, setRole, setAuthed } = useRole();
  const isSuperAdmin = pathname.startsWith('/portal/super-admin');
  const links = isSuperAdmin ? superAdminLinks : adminLinks;

  function handleLogout() {
    setRole('guest');
    setAuthed(false);
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-ember text-white shadow-[0_0_20px_-2px_hsl(22_95%_56%/0.6)]">
          <Tent className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-sm font-bold text-white">YWCA Camp</p>
          <p className="text-xs text-muted-foreground">Staff Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map((l) => {
          const active = pathname === l.href.split('?')[0] && !l.href.includes('?');
          const activeTab = l.href.includes('?') && pathname === l.href.split('?')[0];
          return (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active || activeTab
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-white'
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border/60 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-white">
          <Home className="h-4 w-4" />
          Back to site
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
