import { PageHeader } from '@/components/sections/page-header';
import { NewsContent } from '@/components/sections/news-content';

export const metadata = { title: 'News & Updates — YWCA Camp' };

export default function NewsPage() {
  return (
    <>
      <PageHeader
        eyebrow="News & updates"
        title={<>From the <span className="gradient-text-orange">camp</span></>}
        subtitle="Announcements, community stories and camp life updates from YWCA Camp Ras Sedr."
      />
      <NewsContent />
    </>
  );
}
