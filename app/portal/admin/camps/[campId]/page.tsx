import { notFound } from 'next/navigation';
import { CampDetailContent } from '@/components/portal/camp-detail-content';
import { getCampAnalytics } from '@/lib/queries/analytics';
import { getAllCampsForPortal } from '@/lib/queries/camps';
import { syncFullCampWaitlist } from '@/lib/waitlist';
import { getRegistrationsPage, getCampInsights, type RegistrationStatus } from '@/lib/queries/registrations';

export const metadata = { title: 'Camp — YWCA Camp Portal' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const STATUSES = ['attending', 'pending_payment', 'payment_submitted', 'confirmed', 'waitlisted', 'refunded'];

export default async function CampPage({
  params,
  searchParams,
}: {
  params: { campId: string };
  searchParams: { page?: string; status?: string; q?: string; scope?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const status = STATUSES.includes(searchParams.status ?? '') ? (searchParams.status as RegistrationStatus | 'attending') : undefined;
  const scope: 'all' | 'attending' = searchParams.scope === 'attending' ? 'attending' : 'all';
  const search = searchParams.q?.trim() || undefined;

  // Camp full? Any registration still pending payment becomes waitlist (first registered = #1).
  await syncFullCampWaitlist(params.campId);

  const [camps, analytics] = await Promise.all([getAllCampsForPortal(), getCampAnalytics(params.campId)]);
  const camp = camps.find((c) => c.id === params.campId);
  if (!camp || !analytics) return notFound();

  const [{ rows, count }, insights] = await Promise.all([
    getRegistrationsPage({ campId: params.campId, status, search, page, pageSize: PAGE_SIZE }),
    getCampInsights(params.campId, scope),
  ]);

  return (
    <CampDetailContent
      camp={camp}
      analytics={analytics}
      insights={insights}
      registrations={rows}
      totalCount={count}
      page={page}
      pageSize={PAGE_SIZE}
      statusFilter={status ?? 'all'}
      search={search ?? ''}
      scope={scope}
    />
  );
}
