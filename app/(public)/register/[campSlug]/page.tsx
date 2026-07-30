import { notFound } from 'next/navigation';
import { RegisterContent } from '@/components/sections/register-content';
import { getCampBySlug, getOpenCamps } from '@/lib/queries/camps';

export const revalidate = 300;

export async function generateStaticParams() {
  const camps = await getOpenCamps();
  return camps.map((c) => ({ campSlug: c.slug }));
}

export async function generateMetadata({ params }: { params: { campSlug: string } }) {
  const camp = await getCampBySlug(params.campSlug);
  return { title: camp ? `Register for ${camp.name} — YWCA Camp` : 'Register — YWCA Camp' };
}

export default async function RegisterPage({ params }: { params: { campSlug: string } }) {
  const camp = await getCampBySlug(params.campSlug);
  if (!camp) return notFound();
  return <RegisterContent camp={camp} />;
}
