/*
# Audit log table

## Summary
Accountability trail for staff actions (confirm, refund, waitlist
promotion, camp edits, season changes). Rows are inserted by staff as they
act (actor_id must equal their own auth.uid()).

## RLS (per schema doc)
Guest: none. Admin: SELECT own actions. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_own_audit_log" ON audit_log;
CREATE POLICY "admin_select_own_audit_log"
ON audit_log FOR SELECT
TO authenticated
USING (public.is_admin() AND actor_id = auth.uid());

DROP POLICY IF EXISTS "staff_insert_own_audit_log" ON audit_log;
CREATE POLICY "staff_insert_own_audit_log"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND actor_id = auth.uid());

DROP POLICY IF EXISTS "super_admin_full_audit_log" ON audit_log;
CREATE POLICY "super_admin_full_audit_log"
ON audit_log FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());
