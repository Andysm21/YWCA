import { PageHeader } from '@/components/sections/page-header';
import { ContactContent } from '@/components/sections/contact-content';

export const metadata = { title: 'Contact — YWCA Camp' };

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title={<>Come find us in <span className="gradient-text-teal">Ras Sedr</span></>}
        subtitle="Questions about registration, camp life, or volunteering? Reach out and we'll get back to you."
      />
      <ContactContent />
    </>
  );
}
