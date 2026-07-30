import 'server-only';

/**
 * Minimal in-memory sliding-window rate limit — process-local (resets on
 * deploy/restart, doesn't coordinate across serverless instances). Good
 * enough as defense-in-depth for a low-traffic camp registration site; if
 * abuse becomes a real concern, replace with a shared store (Upstash/Vercel
 * KV) — flagging that as a known limitation, not pretending this scales.
 */
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > maxRequests;
}
