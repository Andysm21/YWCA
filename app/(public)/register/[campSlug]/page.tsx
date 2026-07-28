import { RegisterContent } from '@/components/sections/register-content';
import { allCamps } from '@/lib/camp-data';

export async function generateStaticParams() {
  return allCamps.map((c) => ({ campSlug: c.slug }));
}

export async function generateMetadata({ params }: { params: { campSlug: string } }) {
  const camp = allCamps.find((c) => c.slug === params.campSlug);
  return { title: camp ? `Register for ${camp.name} — YWCA Camp` : 'Register — YWCA Camp' };
}

export default function RegisterPage({ params }: { params: { campSlug: string } }) {
  return <RegisterContent campSlug={params.campSlug} />;
}
