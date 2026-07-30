import { PageHeader } from '@/components/sections/page-header';
import { FaqContent } from '@/components/sections/faq-content';

export const metadata = { title: 'FAQ — YWCA Camp' };

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Frequently asked questions"
        title={<>Got <span className="gradient-text-navy">questions?</span></>}
        subtitle="Everything you need to know about YWCA Camp — from packing to safety to refunds."
      />
      <FaqContent />
    </>
  );
}
