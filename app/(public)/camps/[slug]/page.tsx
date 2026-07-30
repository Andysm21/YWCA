import { notFound } from 'next/navigation';
import { CampDetailContent } from '@/components/sections/camp-detail-content';
import { getCampBySlug, getOpenCamps } from '@/lib/queries/camps';

export const revalidate = 300;

export async function generateStaticParams() {
  const camps = await getOpenCamps();
  return camps.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const camp = await getCampBySlug(params.slug);
  return { title: camp ? `${camp.name} — YWCA Camp` : 'Camp — YWCA Camp' };
}

export default async function CampDetailPage({ params }: { params: { slug: string } }) {
  const camp = await getCampBySlug(params.slug);
  if (!camp) return notFound();
  return <CampDetailContent camp={camp} />;
}
