/**
 * Egypt time helpers. Egypt observes daylight saving time again (UTC+2 in winter,
 * UTC+3 in summer), so never hard-code an offset: let Intl work it out for the
 * given moment.
 */
const TZ = 'Africa/Cairo';

/** Offset (ms) of Cairo local time relative to UTC at the given instant. */
function cairoOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** "2026-12-24T18:30" typed as Cairo wall-clock time -> UTC ISO string, or null if invalid. */
export function cairoLocalToUtcIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[];
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle the hour around DST changes.
  let utc = guess - cairoOffsetMs(new Date(guess));
  utc = guess - cairoOffsetMs(new Date(utc));
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** UTC ISO -> "2026-12-24T18:30" in Cairo wall-clock time (for <input type="datetime-local">). */
export function utcIsoToCairoLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;
}

/** Human-readable Cairo time, e.g. "Thu 24 Dec 2026, 6:30 PM". */
export function formatCairo(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(iso));
}
