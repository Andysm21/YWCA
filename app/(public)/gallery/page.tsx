import { PageHeader } from '@/components/sections/page-header';
import { GalleryMasonry } from '@/components/shared/gallery-masonry';

export const metadata = { title: 'Gallery — YWCA Camp' };

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Camp life"
        title={<>Moments from <span className="gradient-text-mix">Ras Sedr</span></>}
        subtitle="Beach Olympics, campfire nights, desert treks and team challenges — a glimpse of life at camp. Click any photo to enlarge."
      />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <GalleryMasonry />
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Real camp photography will populate here once the admin CMS is connected.
        </p>
      </div>
    </>
  );
}
