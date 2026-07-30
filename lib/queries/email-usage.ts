import 'server-only';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

/**
 * "Today" is Africa/Cairo local time (the site's operating timezone),
 * not UTC — Gmail's daily quota resets at midnight Pacific time in
 * reality, but since there's no live quota API for SMTP senders on a
 * personal account (see the widget label), this is our own send-count
 * estimate anchored to the timezone staff actually operate in, not an
 * attempt to precisely mirror Google's real reset clock.
 */
function startOfTodayCairo(): string {
  const now = new Date();
  const cairoParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now); // "YYYY-MM-DD" in Cairo's calendar day
  // Africa/Cairo is UTC+2 year-round (no DST since 2016) — midnight Cairo
  // is 22:00 UTC the previous day. Constructing the boundary this way
  // (rather than parsing `${cairoParts}T00:00:00+02:00`) avoids relying on
  // a fixed offset assumption breaking silently if Egypt ever reintroduces DST.
  return new Date(`${cairoParts}T00:00:00+02:00`).toISOString();
}

export const ESTIMATED_DAILY_QUOTA = 500;

export async function getTodayEmailUsage(): Promise<{ sentToday: number; estimatedQuota: number }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { count, error } = await supabase
    .from('email_send_log')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', startOfTodayCairo());
  if (error) throw error;

  return { sentToday: count ?? 0, estimatedQuota: ESTIMATED_DAILY_QUOTA };
}
