import { PageHeader } from '@/components/sections/page-header';
import { AboutContent } from '@/components/sections/about-content';

export const metadata = { title: 'About — YWCA Camp' };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About the camp"
        title={<>Built on <span className="gradient-text-orange">values</span>. Run by <span className="gradient-text-navy">volunteers</span>.</>}
        subtitle="The Camp, by the YWCA: a fun-filled, character-building experience led by former campers who volunteer."
      />
      <AboutContent />
    </>
  );
}
