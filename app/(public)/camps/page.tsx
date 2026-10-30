import { PageHeader } from '@/components/sections/page-header';
import { CampsContent } from '@/components/sections/camps-content';
import { getOpenCamps } from '@/lib/queries/camps';

export const metadata = { title: 'Camps — YWCA Camp' };
export const revalidate = 30;

export default async function CampsPage() {
  const camps = await getOpenCamps();
  return (
    <>
      <PageHeader
        eyebrow="Explore the camps"
        title={<>Find your <span className="gradient-text-mix">camp</span></>}
        subtitle="Filter by season, age group, or month to find the perfect camp experience."
      />
      <CampsContent camps={camps} />
    </>
  );
}
