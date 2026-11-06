import 'server-only';

const PRODUCTION_FALLBACK = 'https://ywca-seven.vercel.app';

/**
 * Public base URL used in emails and redirects (no trailing slash).
 *
 * On Vercel production, VERCEL_PROJECT_PRODUCTION_URL (a system env var) is
 * always the project's real domain, so links stay correct even if
 * NEXT_PUBLIC_SITE_URL is missing or points at an old deployment-specific
 * URL. Elsewhere (local dev) NEXT_PUBLIC_SITE_URL wins; a missing value
 * falls back to the production domain so emails never contain broken links.
 */
export function getSiteUrl(): string {
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL_ENV === 'production' && prod) return `https://${prod}`;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  return configured || PRODUCTION_FALLBACK;
}

/**
 * Base for images inside emails: mail clients can only load public https
 * URLs, so local/dev addresses fall back to the production domain.
 */
export function getEmailAssetBase(): string {
  const site = getSiteUrl();
  return site.startsWith('https://') ? site : PRODUCTION_FALLBACK;
}
