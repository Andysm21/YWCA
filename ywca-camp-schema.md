# YWCA Camp — Database Schema & Entity Design (Step 2)

## Design decisions locked in from our conversation

- Registration number: `YC` + 2-digit year + 4-digit **sequential** number, no dashes (e.g. `YC260001`). Sequential (not random) via a per-year counter, so numbers are clean, ordered, and collision-proof.
- Payment reserves the spot (status `payment_submitted` counts toward capacity, not just `confirmed`).
- Refunded registrations do NOT auto-reopen the spot — capacity stays reduced, Admin manually promotes from the waitlist.
- Waitlist: strict FIFO. Waitlisted campers submit Step 1 only (info); they complete Step 2 (payment) only once promoted.
- Documents (certificate + payment screenshot): images only, 10MB max, stored in Google Drive — auto-organized as `/{Camp Name}/Certificates/` and `/{Camp Name}/Payments/`.
- Email sent via the existing free personal Gmail account (SMTP + App Password), same sender address as today.
- No guest accounts — guests are tracked by registration number + email only.
- Bank details (IBAN/beneficiary) are global and the same across all camps — editable later, not per-camp.
- Roles:
  - **Guest** — browse camps, submit registration (Step 1 + Step 2)
  - **Admin** — confirm payments, manage waitlist promotion, mark refunds, edit existing camp details, manage content (news/gallery) — CANNOT open/close seasons or create new camps
  - **Super Admin** — everything, including opening/closing seasons and creating new camps

---

## Tables

### `users`
Staff accounts only (Admin / Super Admin). Guests never get a row here.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | matches Supabase Auth `auth.uid()` |
| email | text, unique | |
| full_name | text | |
| role | enum('admin', 'super_admin') | |
| created_at | timestamptz | |
| created_by | uuid, FK → users.id, nullable | who invited this staff member |

### `seasons`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| year | int | e.g. 2026 |
| type | enum('summer', 'winter') | |
| status | enum('draft', 'open', 'closed') | Super Admin only can change |
| created_by | uuid, FK → users.id | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Unique constraint on `(year, type)` — one Summer and one Winter per year.

### `camps`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| season_id | uuid, FK → seasons.id | |
| name | text | e.g. "Kids 1", "Leadership Camp" |
| slug | text, unique | for URLs |
| age_min | int | |
| age_max | int | |
| price_egp | numeric | |
| capacity | int | default 48, set per-camp when Super Admin opens it |
| date_start | date | |
| date_end | date | |
| description | text | |
| cover_photo_url | text, nullable | |
| status | enum('coming_soon', 'open', 'closed') | derived from capacity + season status, but overridable |
| drive_folder_id | text | root Drive folder for this camp |
| created_by | uuid, FK → users.id | Super Admin only (creation) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `registration_number_counters`
Ensures atomic, collision-free sequential numbers per year.

| Column | Type | Notes |
|---|---|---|
| year | int, PK | e.g. 26 (2-digit) |
| last_number | int | incremented via DB function on each new registration |

### `registrations`
The core record — one row per camper per camp.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| registration_number | text, unique | `YC260001` format |
| camp_id | uuid, FK → camps.id | |
| status | enum('pending_payment', 'waitlisted', 'payment_submitted', 'confirmed', 'refunded') | see state machine below |
| waitlist_position | int, nullable | only set when status = waitlisted |
| camper_name | text | |
| date_of_birth | date | |
| mobile_phone | text | |
| email | text | |
| school | text | |
| academic_year | text | |
| tshirt_size | text | |
| parent_name | text | |
| parent_mobile | text | |
| alternate_mobile | text, nullable | |
| parent_email | text | |
| first_time_camper | boolean | |
| emergency_contact_name | text | |
| emergency_contact_number | text | |
| medical_condition | text, nullable | |
| additional_info | text, nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| confirmed_by | uuid, FK → users.id, nullable | |
| confirmed_at | timestamptz, nullable | |
| refunded_by | uuid, FK → users.id, nullable | |
| refunded_at | timestamptz, nullable | |
| refund_reason | text, nullable | |
| promoted_from_waitlist_at | timestamptz, nullable | |

### `registration_documents`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| registration_id | uuid, FK → registrations.id | |
| type | enum('certificate', 'payment_screenshot') | |
| drive_file_id | text | |
| drive_file_url | text | |
| file_name | text | |
| file_size_bytes | int | max 10MB enforced at upload |
| uploaded_at | timestamptz | |

### `site_settings`
Key-value store for global, rarely-changed config.

| Column | Type | Notes |
|---|---|---|
| key | text, PK | e.g. `bank_iban`, `bank_beneficiary`, `contact_email`, `contact_phone` |
| value | jsonb | |
| updated_by | uuid, FK → users.id | |
| updated_at | timestamptz | |

### `news_posts`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| title | text | |
| slug | text, unique | |
| content | text | |
| cover_image_url | text, nullable | |
| published_at | timestamptz, nullable | null = draft |
| created_by | uuid, FK → users.id | |

### `gallery_images`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| camp_id | uuid, FK → camps.id, nullable | |
| season_id | uuid, FK → seasons.id, nullable | |
| image_url | text | |
| caption | text, nullable | |
| uploaded_by | uuid, FK → users.id | |
| uploaded_at | timestamptz | |

### `audit_log`
Accountability trail for every Admin/Super Admin action (confirm, refund, waitlist promotion, camp edits, season changes).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| actor_id | uuid, FK → users.id | |
| action | text | e.g. `confirm_payment`, `mark_refund`, `promote_waitlist`, `edit_camp`, `open_season` |
| entity_type | text | e.g. `registration`, `camp`, `season` |
| entity_id | uuid | |
| metadata | jsonb | before/after values where relevant |
| created_at | timestamptz | |

---

## Registration state machine

```
pending_payment  →  payment_submitted  →  confirmed
       │                                      │
       │ (camp full at Step 1)                │ (Admin marks refund)
       ▼                                      ▼
   waitlisted  ──(Admin promotes, FIFO)──►  pending_payment    refunded (capacity stays reduced)
```

- New registration at Step 1: if `confirmed + payment_submitted count < capacity` → `pending_payment`. Else → `waitlisted` (position = next in FIFO queue).
- Step 2 (upload docs) moves `pending_payment` → `payment_submitted`. This now counts toward capacity.
- Admin/Super Admin reviews docs, clicks Confirm → `confirmed`.
- Admin/Super Admin marks Refund on a `confirmed` registration → `refunded`. Capacity stays reduced (spot not auto-reopened).
- Admin promotes oldest `waitlisted` registration (FIFO) → moves to `pending_payment`, camper is notified to complete Step 2.

## Google Drive integration (server-side only)

- A Google service account handles all uploads — never exposed to the browser.
- On camp creation, a folder structure is auto-created: `/{Camp Name}/Certificates/` and `/{Camp Name}/Payments/`.
- Upload flow: browser → Next.js API route (validates image type + 10MB limit) → service account uploads to Drive → `drive_file_id` + `drive_file_url` saved to `registration_documents`.
- Folder access is restricted to your staff Google accounts — documents are never publicly linked.
- Noted for later: this can migrate to Supabase Storage if/when budget allows, without changing the rest of the schema (only the document table's storage reference changes).

## Row Level Security (RLS) summary

| Table | Guest (anon) | Admin | Super Admin |
|---|---|---|---|
| registrations | INSERT own (via server route), no SELECT | SELECT all; UPDATE limited to status transitions (confirm, refund, waitlist promotion) only — no editing camper/guardian info | full |
| camps | SELECT (public ones) | SELECT only — no UPDATE/INSERT | full incl. INSERT/UPDATE |
| seasons | SELECT (open ones) | SELECT only | full |
| news_posts / gallery_images | SELECT (published only) | full | full |
| site_settings | none | SELECT, UPDATE | full |
| registration_documents | INSERT own (via server route) | SELECT only (view documents) | full |
| audit_log | none | SELECT own actions | full |
| users | none | none | full |

All writes from Guests go through server-side API routes (using the Supabase service role key), not direct client inserts — this keeps sensitive logic (capacity checks, registration number generation, waitlist assignment) server-controlled rather than trusting the browser.

---

## Admin role — finalized scope

Admin **cannot edit camp details** (no price, dates, capacity, description, or any other camp field changes) and cannot create camps or touch season status. Admin's actual permissions are:

- View uploaded documents (certificates + payment screenshots)
- Confirm payment (`payment_submitted` → `confirmed`)
- Mark a registration as refunded (`confirmed` → `refunded`)
- Promote from the waitlist (`waitlisted` → `pending_payment`, FIFO)
- Manage content (news posts, gallery images)

All camp and season editing/creation is Super Admin only.