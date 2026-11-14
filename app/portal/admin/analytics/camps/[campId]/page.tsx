import { redirect } from 'next/navigation';

// Camp analytics now live on the combined camp page (analytics + registrations).
export default function CampAnalyticsRedirect({ params }: { params: { campId: string } }) {
  redirect(`/portal/admin/camps/${params.campId}`);
}
