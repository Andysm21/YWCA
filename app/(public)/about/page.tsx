import { PageHeader } from '@/components/sections/page-header';
import { AboutContent } from '@/components/sections/about-content';

export const metadata = { title: 'About — YWCA Camp' };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About the camp"
        title={<>Built on <span className="gradient-text-orange">values</span>. Run by <span className="gradient-text-teal">volunteers</span>.</>}
        subtitle="YWCA Camp instills character, teamwork and leadership through immersive team-based games and challenges on the Red Sea coast."
      />
      <AboutContent />
    </>
  );
}
