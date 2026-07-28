import { CampDetailContent } from '@/components/sections/camp-detail-content';
import { allCamps } from '@/lib/camp-data';

export async function generateStaticParams() {
  return allCamps.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const camp = allCamps.find((c) => c.slug === params.slug);
  return { title: camp ? `${camp.name} — YWCA Camp` : 'Camp — YWCA Camp' };
}

export default function CampDetailPage({ params }: { params: { slug: string } }) {
  return <CampDetailContent slug={params.slug} />;
}
