import { PageHeader } from '@/components/sections/page-header';
import { PackingContent } from '@/components/sections/packing-content';

export const metadata = { title: 'Packing List — YWCA Camp' };

export default function PackingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Packing list"
        title={<>Pack <span className="gradient-text-orange">smart</span>, pack <span className="gradient-text-teal">light</span></>}
        subtitle="Everything your camper needs for a week at YWCA Camp. Check items off as you pack."
      />
      <PackingContent />
    </>
  );
}
