import { HomeHero, HomeSeasonExplorer, HomeCalendar, HomeHighlights, HomeGalleryTeaser } from '@/components/sections/home';
import { getOpenSeasonsWithCamps } from '@/lib/queries/camps';

export const revalidate = 300;

export default async function Home() {
  const seasons = await getOpenSeasonsWithCamps();
  return (
    <>
      <HomeHero />
      <HomeSeasonExplorer seasons={seasons} />
      <HomeCalendar seasons={seasons} />
      <HomeHighlights />
      <HomeGalleryTeaser />
    </>
  );
}
