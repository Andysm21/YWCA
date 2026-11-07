import { Suspense } from 'react';
import { PortalSuperAdminContent } from '@/components/portal/portal-super-admin-content';
import { getRegistrationsPage, getRegistrationStats, getCampBreakdown, type RegistrationStatus } from '@/lib/queries/registrations';
import { getAllSeasonsWithCampsForPortal, getAllCampsForPortal } from '@/lib/queries/camps';
import { getCampTypes } from '@/lib/queries/camp-types';
import { getStaffUsers } from '@/lib/queries/users';
import { getNewsPostsPage } from '@/lib/queries/news';
import { getGalleryImagesPage } from '@/lib/queries/gallery';
import { getTodayEmailUsage } from '@/lib/queries/email-usage';
import { getPublicSiteSettings } from '@/lib/queries/site-settings';

export const metadata = { title: 'Super Admin Dashboard — YWCA Camp Portal' };

const PAGE_SIZE = 25;

type SearchParams = {
  tab?: string;
  page?: string;
  camp?: string;
  status?: string;
  newsPage?: string;
  galleryPage?: string;
};

async function SuperAdminData({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const campId = searchParams.camp && searchParams.camp !== 'all' ? searchParams.camp : undefined;
  const status = searchParams.status && searchParams.status !== 'all' ? (searchParams.status as RegistrationStatus) : undefined;
  const newsPage = Math.max(1, parseInt(searchParams.newsPage ?? '1', 10) || 1);
  const galleryPage = Math.max(1, parseInt(searchParams.galleryPage ?? '1', 10) || 1);

  const [{ rows, count }, stats, campBreakdown, seasons, camps, campTypes, staffUsers, newsPageResult, galleryPageResult, emailUsage, siteSettings] = await Promise.all([
    getRegistrationsPage({ page, pageSize: PAGE_SIZE, campId, status }),
    getRegistrationStats(),
    getCampBreakdown(),
    getAllSeasonsWithCampsForPortal(),
    getAllCampsForPortal(),
    getCampTypes(),
    getStaffUsers(),
    getNewsPostsPage({ page: newsPage, pageSize: 10 }),
    getGalleryImagesPage({ page: galleryPage, pageSize: 24 }),
    getTodayEmailUsage(),
    getPublicSiteSettings(),
  ]);

  return (
    <PortalSuperAdminContent
      registrations={rows}
      totalCount={count}
      page={page}
      pageSize={PAGE_SIZE}
      stats={stats}
      campBreakdown={campBreakdown}
      seasons={seasons}
      camps={camps}
      campTypes={campTypes}
      campFilter={searchParams.camp ?? 'all'}
      statusFilter={searchParams.status ?? 'all'}
      staffUsers={staffUsers}
      newsPosts={newsPageResult.rows}
      newsTotalCount={newsPageResult.count}
      newsPage={newsPage}
      galleryImages={galleryPageResult.rows}
      galleryTotalCount={galleryPageResult.count}
      galleryPage={galleryPage}
      emailUsage={emailUsage}
      siteSettings={siteSettings}
    />
  );
}

export default function PortalSuperAdminPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    // Keyed on the query string so switching tabs/pages shows the loading state immediately
    // instead of leaving the old tab on screen while the new data loads.
    <Suspense key={JSON.stringify(searchParams)} fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>}>
      <SuperAdminData searchParams={searchParams} />
    </Suspense>
  );
}
