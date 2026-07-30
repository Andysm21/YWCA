/*
# Registration documents table

## Summary
Metadata for certificate + payment-screenshot uploads stored in Google
Drive (Drive integration itself is next phase — this just holds the
pointer columns per the schema doc).

## RLS (per schema doc)
Guest: INSERT own via server route only — no anon/authenticated policy here
either, same reasoning as `registrations` (server route uses the service
role key). Admin: SELECT only. Super Admin: full.
*/

CREATE TABLE IF NOT EXISTS registration_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  drive_file_id text NOT NULL,
  drive_file_url text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes int NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  CHECK (file_size_bytes > 0 AND file_size_bytes <= 10 * 1024 * 1024)
);

CREATE INDEX IF NOT EXISTS idx_registration_documents_registration_id ON registration_documents(registration_id);

ALTER TABLE registration_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_registration_documents" ON registration_documents;
CREATE POLICY "admin_select_registration_documents"
ON registration_documents FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "super_admin_full_registration_documents" ON registration_documents;
CREATE POLICY "super_admin_full_registration_documents"
ON registration_documents FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());
