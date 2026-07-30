/*
# Site settings table

## Summary
Key-value store for rarely-changed global config (bank IBAN/beneficiary,
contact email/phone).

## RLS (per schema doc)
Guest: none. Admin: SELECT, UPDATE. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_site_settings" ON site_settings;
CREATE POLICY "admin_select_site_settings"
ON site_settings FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings"
ON site_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "super_admin_insert_delete_site_settings" ON site_settings;
CREATE POLICY "super_admin_insert_delete_site_settings"
ON site_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_delete_site_settings" ON site_settings;
CREATE POLICY "super_admin_delete_site_settings"
ON site_settings FOR DELETE
TO authenticated
USING (public.is_super_admin());
