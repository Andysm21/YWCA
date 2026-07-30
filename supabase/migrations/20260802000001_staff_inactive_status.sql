/*
# Add 'inactive' value to staff_status enum

## Summary
Adds a third `staff_status` value, `inactive`, so a Super Admin can
deactivate a staff account without deleting it. Postgres requires a new
enum value to be committed in its own transaction before it can be
referenced anywhere else (a function body, a CHECK constraint, a DML
statement) — so this migration contains ONLY the enum extension. The
follow-up migration (20260802000002) updates `current_staff_role()` to
actually treat `inactive` as "not staff".
*/

ALTER TYPE staff_status ADD VALUE 'inactive';
