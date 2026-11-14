import { NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { requireStaff } from '@/lib/auth/require-staff';
import { getDriveFileStream, checkDriveConnection } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic', pdf: 'application/pdf',
};

/**
 * Staff-only viewer/downloader for a registration's uploaded files (birth
 * certificate, payment proof). The files live in a private Google Drive, so
 * the browser can't open them directly: this route checks the staff session,
 * then streams the file out of Drive. `?download=1` forces a download.
 */
export async function GET(request: Request, { params }: { params: { id: string; docId: string } }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: doc, error } = await supabase
    .from('registration_documents')
    .select('id, type, drive_file_id, drive_file_url, file_name, registrations(registration_number)')
    .eq('id', params.docId)
    .eq('registration_id', params.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const regRel = (doc as any).registrations;
  const regNumber = (Array.isArray(regRel) ? regRel[0] : regRel)?.registration_number ?? 'registration';
  const ext = (doc.file_name.split('.').pop() ?? '').toLowerCase();
  const label = doc.type === 'certificate' ? 'birth-certificate' : 'payment-proof';
  const downloadName = `${regNumber}-${label}${ext ? `.${ext}` : ''}`;
  const asDownload = new URL(request.url).searchParams.get('download') === '1';

  try {
    const { stream, mimeType, size } = await getDriveFileStream(doc.drive_file_id);
    const contentType = MIME_BY_EXT[ext] ?? mimeType ?? 'application/octet-stream';
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `${asDownload ? 'attachment' : 'inline'}; filename="${downloadName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    };
    if (size) headers['Content-Length'] = String(size);
    return new Response(Readable.toWeb(stream) as unknown as ReadableStream, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read the file from Google Drive';
    console.error('[document viewer]', err);
    const diag = await checkDriveConnection();
    const authIssue = /deleted_client|invalid_grant|invalid_client|unauthorized_client|GOOGLE_OAUTH|GOOGLE_DRIVE/i.test(message);
    return NextResponse.json(
      {
        error: authIssue
          ? 'File storage (Google Drive) is not connected right now. Use "Open in Drive" instead, and ask the site owner to reconnect Google Drive.'
          : 'Could not read the file from Google Drive.',
        driveUrl: doc.drive_file_url,
        diagnosis: diag.ok ? 'Drive connection is OK, but this specific file could not be read (deleted, moved, or not owned by the connected account).' : `${diag.reason}: ${diag.detail}`,
      },
      { status: 502 }
    );
  }
}
