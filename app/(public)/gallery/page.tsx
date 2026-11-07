import { PageHeader } from '@/components/sections/page-header';
import { getPublicGalleryImages } from '@/lib/queries/gallery';
import { GalleryMasonry } from '@/components/shared/gallery-masonry';

export const revalidate = 30;

export const metadata = { title: 'Gallery — YWCA Camp' };

export default async function GalleryPage() {
  const images = await getPublicGalleryImages();
  return (
    <>
      <PageHeader
        eyebrow="Camp life"
        title={<>Moments from <span className="gradient-text-mix">The Camp</span></>}
        subtitle="A glimpse of life at camp. Click any photo to enlarge."
      />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <GalleryMasonry images={images} showcase />
      </div>
    </>
  );
}
