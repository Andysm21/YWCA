import { PortalSuperAdminContent } from '@/components/portal/portal-super-admin-content';
import { Suspense } from 'react';

export const metadata = { title: 'Super Admin Dashboard — YWCA Camp Portal' };

export default function PortalSuperAdminPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>}>
      <PortalSuperAdminContent />
    </Suspense>
  );
}
