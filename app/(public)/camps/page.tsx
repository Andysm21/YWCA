import { PageHeader } from '@/components/sections/page-header';
import { CampsContent } from '@/components/sections/camps-content';
import { getOpenCamps } from '@/lib/queries/camps';

export const metadata = { title: 'Camps — YWCA Camp' };
export const revalidate = 300;

export default async function CampsPage() {
  const camps = await getOpenCamps();
  return (
    <>
      <PageHeader
        eyebrow="Explore the camps"
        title={<>Two seasons, <span className="gradient-text-mix">ten camps</span></>}
        subtitle="Filter by season, age group, or month to find the perfect camp experience."
      />
      <CampsContent camps={camps} />
    </>
  );
}
