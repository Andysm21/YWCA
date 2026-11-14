import { notFound } from 'next/navigation';
import { CampDetailContent } from '@/components/portal/camp-detail-content';
import { getCampAnalytics } from '@/lib/queries/analytics';
import { getAllCampsForPortal } from '@/lib/queries/camps';
import { getRegistrationsPage, getCampInsights, type RegistrationStatus } from '@/lib/queries/registrations';

export const metadata = { title: 'Camp — YWCA Camp Portal' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const STATUSES = ['pending_payment', 'payment_submitted', 'confirmed', 'waitlisted', 'refunded'];

export default async function CampPage({
  params,
  searchParams,
}: {
  params: { campId: string };
  searchParams: { page?: string; status?: string; q?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const status = STATUSES.includes(searchParams.status ?? '') ? (searchParams.status as RegistrationStatus) : undefined;
  const search = searchParams.q?.trim() || undefined;

  const [camps, analytics] = await Promise.all([getAllCampsForPortal(), getCampAnalytics(params.campId)]);
  const camp = camps.find((c) => c.id === params.campId);
  if (!camp || !analytics) return notFound();

  const [{ rows, count }, insights] = await Promise.all([
    getRegistrationsPage({ campId: params.campId, status, search, page, pageSize: PAGE_SIZE }),
    getCampInsights(params.campId),
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
    />
  );
}
