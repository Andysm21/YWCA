'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { PortalSidebar } from '@/components/portal/portal-sidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/portal/login';

  if (isLogin) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen flex">
      <PortalSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
