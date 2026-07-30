'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Camps', href: '/camps' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'About', href: '/about' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Packing', href: '/packing' },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className={cn(
      'fixed inset-x-0 top-0 z-50 transition-all duration-300 print:hidden',
      scrolled ? 'border-b border-border/60 bg-background/80 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
    )}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <Logo size="md" priority className="transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_14px_hsl(var(--primary)/0.45)]" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">YWCA Camp</span>
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href}
                className={cn('relative rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {l.label}
                {active && <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
            <Link href="/camps">
              Register
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Menu" className="lg:hidden" onClick={() => setOpen((v) => !v)}>
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
                  className={cn('rounded-lg px-3 py-2.5 text-sm font-medium', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  {l.label}
                </Link>
              );
            })}
            <div className="mt-2">
              <Button asChild size="sm" className="w-full rounded-full">
                <Link href="/camps">Register</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
