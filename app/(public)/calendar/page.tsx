import { PageHeader } from '@/components/sections/page-header';
import { CalendarContent } from '@/components/sections/calendar-content';
import { getOpenCamps } from '@/lib/queries/camps';

export const metadata = { title: 'Calendar — YWCA Camp' };
export const revalidate = 30;

export default async function CalendarPage() {
  const camps = await getOpenCamps();
  return (
    <>
      <PageHeader
        eyebrow="Camp calendar"
        title={<>The full <span className="gradient-text-navy">camp year</span></>}
        subtitle="Jump between the months that have camps and click any camp for details and registration."
      />
      <CalendarContent camps={camps} />
    </>
  );
}
