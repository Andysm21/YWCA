import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Writes one audit_log row. Uses the caller's own cookie-authenticated
 * client (not service-role) — RLS's `staff_insert_own_audit_log` policy
 * requires actor_id = auth.uid(), which is exactly what we're passing, so
 * this is both correct and self-verifying (if actorId were ever wrong,
 * RLS would reject the insert rather than silently logging a false actor).
 *
 * Never throws — a failed audit write shouldn't roll back or block the
 * actual mutation it's describing. Logged server-side for visibility.
 */
export async function writeAuditLog(
  supabase: SupabaseClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.from('audit_log').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? null,
  });
  if (error) {
    console.error('[audit_log] insert failed', { action, entityType, entityId, error });
  }
}
