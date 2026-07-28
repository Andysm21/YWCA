import { PageHeader } from '@/components/sections/page-header';
import { CalendarContent } from '@/components/sections/calendar-content';

export const metadata = { title: 'Calendar — YWCA Camp' };

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Camp calendar"
        title={<>The full <span className="gradient-text-teal">camp year</span></>}
        subtitle="Switch between seasons and years, jump to any month, and click a camp for details."
      />
      <CalendarContent />
    </>
  );
}
