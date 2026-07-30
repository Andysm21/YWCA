import { PortalAdminContent } from '@/components/portal/portal-admin-content';
import { getRegistrationsPage, getRegistrationStats, getCampBreakdown, type RegistrationStatus } from '@/lib/queries/registrations';
import { getAllCampsForPortal } from '@/lib/queries/camps';

export const metadata = { title: 'Admin Dashboard — YWCA Camp Portal' };

const PAGE_SIZE = 25;

export default async function PortalAdminPage({
  searchParams,
}: {
  searchParams: { page?: string; camp?: string; status?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const campId = searchParams.camp && searchParams.camp !== 'all' ? searchParams.camp : undefined;
  const status = searchParams.status && searchParams.status !== 'all' ? (searchParams.status as RegistrationStatus) : undefined;

  const [{ rows, count }, stats, camps, campBreakdown] = await Promise.all([
    getRegistrationsPage({ page, pageSize: PAGE_SIZE, campId, status }),
    getRegistrationStats(),
    getAllCampsForPortal(),
    getCampBreakdown(),
  ]);

  return (
    <PortalAdminContent
      registrations={rows}
      totalCount={count}
      page={page}
      pageSize={PAGE_SIZE}
      stats={stats}
      camps={camps}
      campBreakdown={campBreakdown}
      campFilter={searchParams.camp ?? 'all'}
      statusFilter={searchParams.status ?? 'all'}
    />
  );
}
