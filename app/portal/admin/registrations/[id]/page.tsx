import { notFound } from 'next/navigation';
import { RegistrationDetailContent } from '@/components/portal/registration-detail-content';
import { getRegistrationDetail } from '@/lib/queries/registrations';

export const metadata = { title: 'Registration — YWCA Camp Portal' };
export const dynamic = 'force-dynamic';

export default async function RegistrationPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return notFound();
  const detail = await getRegistrationDetail(params.id);
  if (!detail) return notFound();
  return <RegistrationDetailContent registration={detail.registration} camp={detail.camp} documents={detail.documents} />;
}
