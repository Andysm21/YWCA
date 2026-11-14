import 'server-only';
import { google } from 'googleapis';
import { Readable } from 'node:stream';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

/**
 * OAuth2 (not a service-account JWT) — service accounts have zero Drive
 * storage quota of their own on a free/personal account (Google requires a
 * Workspace Shared Drive for that, which we don't have), so uploads via a
 * service account fail with 403 "Service Accounts do not have storage
 * quota" even with folder access shared to them. Authenticating as an
 * actual Google account instead means uploads count against THAT account's
 * normal 15GB Drive quota.
 *
 * The refresh token below is long-lived but NOT permanent — Google can
 * invalidate it (password change, the token going unused for 6+ months, or
 * revoking it manually under Google Account -> Security -> Third-party
 * access). If uploads start failing with an auth/invalid_grant error,
 * that's what happened: redo the OAuth consent flow (e.g. via Google's
 * OAuth 2.0 Playground with the Drive scope, using this project's client
 * ID/secret) to mint a new GOOGLE_OAUTH_REFRESH_TOKEN.
 */
function getDriveClient() {
  if (!ROOT_FOLDER_ID) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not set');

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN not set');
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  // googleapis uses this refresh token to silently mint short-lived access
  // tokens on every call from here on — no manual refresh-handling needed.
  auth.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth });
}

/**
 * Finds a folder by exact name under `parentId`, creating it if it doesn't
 * exist. Idempotent — safe to call on every upload rather than caching IDs,
 * since Drive has no unique-name constraint and repeated calls with the
 * same (name, parent) always resolve to the same folder once it exists.
 */
async function ensureFolder(drive: ReturnType<typeof getDriveClient>, parentId: string, name: string): Promise<string> {
  const escapedName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { data } = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const existing = data.files?.[0];
  if (existing?.id) return existing.id;

  const { data: created } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  if (!created.id) throw new Error(`Failed to create Drive folder "${name}"`);
  return created.id;
}

/**
 * Resolves (creating if needed) /{seasonName}/{campName}/Certificates/ and
 * /{seasonName}/{campName}/Payments/ under the shared root folder. Called
 * on every upload — cheap (3-4 list calls) and avoids needing to persist/
 * track folder ids anywhere ourselves (camps.drive_folder_id exists in the
 * schema for this, but resolving fresh each time is simpler and self-
 * healing if a folder is ever manually moved/renamed in Drive).
 *
 * `seasonName` is caller-formatted (e.g. "Summer 2026") — this function
 * doesn't know about seasons.year/type, just takes a folder name string.
 *
 * Pre-existing files uploaded before this season layer was added (test
 * uploads from initial Drive-auth verification) are left flat under root —
 * not migrated, since they were test data, not real registrations.
 */
export async function getOrCreateCampFolders(seasonName: string, campName: string): Promise<{ certificatesFolderId: string; paymentsFolderId: string }> {
  const drive = getDriveClient();
  const seasonFolderId = await ensureFolder(drive, ROOT_FOLDER_ID!, seasonName);
  const campFolderId = await ensureFolder(drive, seasonFolderId, campName);
  const [certificatesFolderId, paymentsFolderId] = await Promise.all([
    ensureFolder(drive, campFolderId, 'Certificates'),
    ensureFolder(drive, campFolderId, 'Payments'),
  ]);
  return { certificatesFolderId, paymentsFolderId };
}

export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ driveFileId: string; driveFileUrl: string }> {
  const drive = getDriveClient();

  const { data } = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id, webViewLink',
  });

  if (!data.id) throw new Error(`Failed to upload "${fileName}" to Drive`);
  return { driveFileId: data.id, driveFileUrl: data.webViewLink ?? `https://drive.google.com/file/d/${data.id}/view` };
}

/** Streams a stored file back out of Drive (used by the staff-only document viewer route). */
export async function getDriveFileStream(fileId: string): Promise<{ stream: Readable; mimeType: string | null; size: number | null }> {
  const drive = getDriveClient();
  const meta = await drive.files.get({ fileId, fields: 'mimeType, size' });
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  return {
    stream: res.data as unknown as Readable,
    mimeType: meta.data.mimeType ?? null,
    size: meta.data.size ? Number(meta.data.size) : null,
  };
}
