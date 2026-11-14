import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/require-staff';
import { checkDriveConnection } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

/** Staff-only: is Google Drive (file storage) connected on this deployment? Never returns secrets. */
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const status = await checkDriveConnection();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
