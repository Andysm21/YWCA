'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isChromeless = pathname === '/portal/login' || pathname === '/portal/accept-invite';

  React.useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (isChromeless) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen">
      <PortalSidebar mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} />
      <div className="min-w-0 flex-1">
        {/* Mobile top bar — the sidebar is a slide-over drawer below lg */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Logo size="sm" />
          <span className="font-display text-sm font-bold text-foreground">Staff Portal</span>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
