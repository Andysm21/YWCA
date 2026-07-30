import { StatusLookupContent } from '@/components/sections/status-lookup-content';
import { getOpenCamps } from '@/lib/queries/camps';

export const revalidate = 0;

export default async function RegistrationStatusPage() {
  const camps = await getOpenCamps();
  return <StatusLookupContent camps={camps} />;
}
