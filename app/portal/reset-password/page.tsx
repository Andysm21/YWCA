import { Suspense } from 'react';
import { ResetPasswordContent } from '@/components/portal/reset-password-content';

export const metadata = { title: 'Set New Password — YWCA Camp Staff Portal' };

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
