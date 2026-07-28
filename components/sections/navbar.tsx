'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tent, Menu, X, ArrowRight, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRole, type Role } from '@/components/role-context';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Camps', href: '/camps' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'About', href: '/about' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'News', href: '/news' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Packing', href: '/packing' },
  { label: 'Contact', href: '/contact' },
];

const roleCta: Record<Role, { label: string; href: string; icon: React.ElementType }> = {
  guest: { label: 'Register', href: '/camps', icon: ArrowRight },
  admin: { label: 'Dashboard', href: '/portal/admin', icon: LayoutDashboard },
  'super-admin': { label: 'Manage', href: '/portal/super-admin', icon: Settings },
};

export function Navbar() {
  const pathname = usePathname();
  const { role, setRole } = useRole();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => { setOpen(false); }, [pathname]);

  const cta = roleCta[role];

  return (
    <header className={cn(
      'fixed inset-x-0 top-0 z-50 transition-all duration-300',
      scrolled ? 'border-b border-border/60 bg-background/80 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
    )}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-ember text-white shadow-[0_0_20px_-2px_hsl(22_95%_56%/0.6)]">
            <Tent className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">YWCA Camp</span>
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href}
                className={cn('relative rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'text-white' : 'text-muted-foreground hover:text-white')}>
                {l.label}
                {active && <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="hidden rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm outline-none hover:text-white sm:block"
            aria-label="Switch role"
          >
            <option value="guest">Guest</option>
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
          </select>
          <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
            <Link href={cta.href}>
              {cta.label}
              <cta.icon className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Menu" className="text-white hover:bg-white/10 lg:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {open && (
        <div className="border-b border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1 px-4 py-4 max-h-[80vh] overflow-y-auto">
            {navLinks.map((l) => {
              const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href}
                  className={cn('rounded-lg px-3 py-2.5 text-sm font-medium', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-white')}>
                  {l.label}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center gap-2">
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}
                className="flex-1 rounded-full border border-border/60 bg-card/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <option value="guest">Guest</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
              <Button asChild size="sm" className="rounded-full">
                <Link href={cta.href}>{cta.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
