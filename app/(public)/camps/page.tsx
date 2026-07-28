import { PageHeader } from '@/components/sections/page-header';
import { CampsContent } from '@/components/sections/camps-content';

export const metadata = { title: 'Camps — YWCA Camp' };

export default function CampsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Explore the camps"
        title={<>Two seasons, <span className="gradient-text-mix">ten camps</span></>}
        subtitle="Filter by season, age group, or month to find the perfect camp experience."
      />
      <CampsContent />
    </>
  );
}
