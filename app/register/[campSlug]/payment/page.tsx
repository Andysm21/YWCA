import { notFound } from 'next/navigation';
import { PaymentContent } from '@/components/sections/payment-content';
import { RegistrationStatusView } from '@/components/sections/registration-status-view';
import { getCampBySlug } from '@/lib/queries/camps';
import { getBankDetails } from '@/lib/queries/site-settings';
import { getRegistrationStatusByCode } from '@/lib/queries/guest-registration';

export const revalidate = 0;

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: { campSlug: string };
  searchParams: { code?: string };
}) {
  const camp = await getCampBySlug(params.campSlug);
  if (!camp) return notFound();

  // Server-side gate against double submission: if the ?code= in the link
  // already belongs to a registration that's moved past pending_payment
  // (payment already submitted, confirmed, refunded, or waitlisted), show
  // a read-only status view instead of the upload form. This is UX only —
  // the POST handler (app/api/register/payment/route.ts) independently
  // re-checks status itself, since this check can't be trusted to survive
  // to submit time (a second tab, a stale page load, etc).
  const code = searchParams.code?.trim() ?? '';
  if (code) {
    const registration = await getRegistrationStatusByCode(params.campSlug, code);
    if (registration && registration.status !== 'pending_payment') {
      return (
        <RegistrationStatusView
          status={registration.status}
          registrationNumber={registration.registrationNumber}
          camperName={registration.camperName}
          campName={registration.campName}
          campSlug={registration.campSlug}
          waitlistPosition={registration.waitlistPosition}
        />
      );
    }
  }

  const bankDetails = await getBankDetails();

  return <PaymentContent camp={camp} bankDetails={bankDetails} initialCode={code} />;
}
