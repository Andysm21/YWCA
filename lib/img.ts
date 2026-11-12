/** Route a remote photo through the Next/Vercel image optimizer (resized, WebP/AVIF, cached). */
const WIDTHS = [384, 640, 828, 1080, 1920] as const;
export type OptWidth = (typeof WIDTHS)[number];

export function optimizedImage(url: string, w: OptWidth = 640, q = 72): string {
  if (!/^https:\/\/[^/]+\.supabase\.co\//.test(url)) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=${q}`;
}

export function optimizedSrcSet(url: string, widths: OptWidth[] = [384, 640, 828], q = 72): string | undefined {
  if (!/^https:\/\/[^/]+\.supabase\.co\//.test(url)) return undefined;
  return widths.map((w) => `${optimizedImage(url, w, q)} ${w}w`).join(', ');
}
