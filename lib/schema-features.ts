import 'server-only';
import { createServiceClient } from '@/utils/supabase/service';

/**
 * The birth-date range (camps.dob_min/dob_max) and bus pickup
 * (registrations.bus_pickup) columns come from migration
 * 20260806000001, which is applied by hand in the Supabase SQL editor. Until
 * it has been run, queries that select/insert those columns would fail and
 * take the whole site down — so the code checks once whether the columns
 * exist and quietly leaves the features off if they don't.
 *
 * A "yes" is cached for the life of the server instance; a "no" is
 * re-checked every 30 seconds so the features switch on soon after the SQL runs.
 */
let cached: { ready: boolean; checkedAt: number } | null = null;

export async function newColumnsReady(): Promise<boolean> {
  if (cached && (cached.ready || Date.now() - cached.checkedAt < 30_000)) return cached.ready;
  try {
    const supabase = createServiceClient();
    const [camps, regs] = await Promise.all([
      supabase.from('camps').select('dob_min, dob_max').limit(1),
      supabase.from('registrations').select('bus_pickup').limit(1),
    ]);
    cached = { ready: !camps.error && !regs.error, checkedAt: Date.now() };
  } catch {
    cached = { ready: false, checkedAt: Date.now() };
  }
  return cached.ready;
}

/**
 * camps.opens_at + open_due_camps() come from migration
 * 20260815000001 (scheduled camp opening), also applied by hand in the SQL
 * editor. Same approach as above: off until the column exists.
 */
let scheduleCached: { ready: boolean; checkedAt: number } | null = null;

export async function scheduleReady(): Promise<boolean> {
  if (scheduleCached && (scheduleCached.ready || Date.now() - scheduleCached.checkedAt < 30_000)) return scheduleCached.ready;
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('camps').select('opens_at').limit(1);
    scheduleCached = { ready: !error, checkedAt: Date.now() };
  } catch {
    scheduleCached = { ready: false, checkedAt: Date.now() };
  }
  return scheduleCached.ready;
}
