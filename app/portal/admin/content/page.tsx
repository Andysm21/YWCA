import { AdminContentClient } from '@/components/portal/admin-content-client';
import { getAllSeasonsWithCampsForPortal, getAllCampsForPortal } from '@/lib/queries/camps';
import { getNewsPostsPage } from '@/lib/queries/news';
import { getGalleryImagesPage } from '@/lib/queries/gallery';

export const metadata = { title: 'Content — YWCA Camp Admin Portal' };

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: { newsPage?: string; galleryPage?: string };
}) {
  const newsPage = Math.max(1, parseInt(searchParams.newsPage ?? '1', 10) || 1);
  const galleryPage = Math.max(1, parseInt(searchParams.galleryPage ?? '1', 10) || 1);

  const [seasons, camps, newsPageResult, galleryPageResult] = await Promise.all([
    getAllSeasonsWithCampsForPortal(),
    getAllCampsForPortal(),
    getNewsPostsPage({ page: newsPage, pageSize: 10 }),
    getGalleryImagesPage({ page: galleryPage, pageSize: 24 }),
  ]);

  return (
    <AdminContentClient
      seasons={seasons}
      camps={camps}
      newsPosts={newsPageResult.rows}
      newsTotalCount={newsPageResult.count}
      newsPage={newsPage}
      galleryImages={galleryPageResult.rows}
      galleryTotalCount={galleryPageResult.count}
      galleryPage={galleryPage}
    />
  );
}
