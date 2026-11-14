import 'server-only';
import { createServiceClient } from '@/utils/supabase/service';
import { scheduleReady } from '@/lib/schema-features';

let lastRun = 0;

/**
 * Opens every hidden camp whose scheduled time has passed (status 'closed' +
 * opens_at <= now -> 'open'). Cheap and idempotent, so it is called whenever
 * camps are read for the public site or someone registers. Throttled to once
 * every few seconds per server instance; never throws.
 */
export async function openDueCamps(force = false): Promise<number> {
  if (!force && Date.now() - lastRun < 5_000) return 0;
  lastRun = Date.now();
  try {
    if (!(await scheduleReady())) return 0;
    const { data, error } = await createServiceClient().rpc('open_due_camps');
    if (error) {
      console.error('[openDueCamps]', error.message);
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  } catch (err) {
    console.error('[openDueCamps]', err);
    return 0;
  }
}
