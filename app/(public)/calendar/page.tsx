import { PageHeader } from '@/components/sections/page-header';
import { CalendarContent } from '@/components/sections/calendar-content';
import { getOpenCamps } from '@/lib/queries/camps';

export const metadata = { title: 'Calendar — YWCA Camp' };
export const revalidate = 300;

export default async function CalendarPage() {
  const camps = await getOpenCamps();
  return (
    <>
      <PageHeader
        eyebrow="Camp calendar"
        title={<>The full <span className="gradient-text-navy">camp year</span></>}
        subtitle="Switch between seasons and years, jump to any month, and click a camp for details."
      />
      <CalendarContent camps={camps} />
    </>
  );
}
