import 'server-only';
import { createServiceClient } from '@/utils/supabase/service';

/**
 * Spots currently HELD per camp = confirmed payments + payments awaiting
 * confirmation + people promoted from the waitlist who are still paying
 * (a promoted registration keeps its spot while they pay). Plain
 * pending-payment registrations hold nothing; waitlisted/refunded hold nothing.
 *
 * Uses the service role because guests can't read the registrations table;
 * only counts ever leave this function. `excludeRegistrationId` lets a
 * registration check capacity without counting its own hold.
 */
export async function getHeldSpotsByCamp(campIds: string[], excludeRegistrationId?: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.fromEntries(campIds.map((id) => [id, 0]));
  if (campIds.length === 0) return counts;
  const { data, error } = await createServiceClient()
    .from('registrations')
    .select('id, camp_id, status, promoted_from_waitlist_at')
    .in('camp_id', campIds)
    .in('status', ['confirmed', 'payment_submitted', 'pending_payment']);
  if (error) throw error;
  for (const r of data ?? []) {
    if (excludeRegistrationId && r.id === excludeRegistrationId) continue;
    const holds = r.status !== 'pending_payment' || r.promoted_from_waitlist_at !== null;
    if (holds) counts[r.camp_id] = (counts[r.camp_id] ?? 0) + 1;
  }
  return counts;
}

export async function getHeldSpots(campId: string, excludeRegistrationId?: string): Promise<number> {
  return (await getHeldSpotsByCamp([campId], excludeRegistrationId))[campId] ?? 0;
}
