import { HomeHero, HomeSeasonExplorer, HomeCalendar, HomeHighlights, HomeGalleryTeaser } from '@/components/sections/home';
import { getOpenSeasonsWithCamps } from '@/lib/queries/camps';
import { getPublicGalleryImages } from '@/lib/queries/gallery';

export const revalidate = 30;

export default async function Home() {
  const [seasons, galleryImages] = await Promise.all([getOpenSeasonsWithCamps(), getPublicGalleryImages(8)]);
  return (
    <>
      <HomeHero seasons={seasons} />
      <HomeSeasonExplorer seasons={seasons} />
      <HomeCalendar seasons={seasons} />
      <HomeHighlights />
      <HomeGalleryTeaser images={galleryImages} />
    </>
  );
}
