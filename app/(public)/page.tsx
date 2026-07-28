import { HomeHero, HomeSeasonExplorer, HomeCalendar, HomeHighlights, HomeNews, HomeGalleryTeaser } from '@/components/sections/home';

export default function Home() {
  return (
    <>
      <HomeHero />
      <HomeSeasonExplorer />
      <HomeCalendar />
      <HomeHighlights />
      <HomeNews />
      <HomeGalleryTeaser />
    </>
  );
}
