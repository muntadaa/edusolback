# Frontend guide: Courses & notes, presence validation, and report flow

This document explains how the **Courses & notes** screen should use **`student_presence_validation`**, how it connects to **`student_presence`**, and how **aggregates** lead to **`student_report_details`**.

All routes are under the global prefix **`/api`**. Send **`Authorization: Bearer <JWT>`** on every request.

---

## 1. End-to-end business flow

Three layers:

1. **`student_presence`** — One row per **(student, session)**. Holds attendance, **`note`**, remarks, **`notes_locked`**, etc.
2. **`student_presence_validation`** — One row per **`student_presence`** **after** the teacher finalizes session notes. Scholarity **approves** / **rejects** whether that row may be used for **aggregates** and **reports**.
3. **`student_report` + `student_report_details`** — Official report header + lines.

### Step-by-step (aligned with your UI)

| Step | Who | What happens |
|------|-----|----------------|
| 1 | Teacher | Creates/updates **`student_presence`** (note, presence) via **`POST /api/student-presence`**. **No** validation row is created yet. |
| 2 | Teacher | Clicks **Validate notes (final)** → **`POST /api/students-plannings/:id/notes/validate`** (session must have **`has_notes`**). Backend sets **`notes_locked`** on all presence rows for that session **and** creates **`student_presence_validation`** rows (**`pending`**) for each. |
| 2b | Scholarity (alternate) | If scholarity locks notes on the planning (**`notes_validated_controleur`**), the same **pending** validation rows are created for that session’s presences. |
| 3 | Scholarity | **Courses & notes → Session details:** sees **Pending** / **Approved** / **Rejected**. Can **edit note/remarks** while **pending** (§2.4), then **approve** or **reject**. |
| 4 | Scholarity | **Approved** → included in **`course-notes-aggregates`**. **Rejected** and **pending** → **excluded** from aggregates. |
| 5 | Scholarity | **Aggregates** tab uses aggregate API; **Sync to report details** should only use rows that are effectively **approved** (backend aggregate already filters). |
| 6 | Scholarity | **`POST /api/student-report-details/batch`** with a **`student_report_id`**. |

**Rule:** **`course-notes-aggregates`** only counts presences linked to **`student_presence_validation.status === 'approved'`**. Pending/rejected (or no validation row) do not affect sums/averages.

### Legacy / bad data

If you deployed the old behavior (validation on first presence insert), you may have **pending** validations before teacher validated notes. Optional SQL cleanup: `database/migrations/student_presence_validation_cleanup_pre_validate_notes.sql` (review before run).

---

## 2. Validation API (`student_presence_validation`)

### 2.1 List validations

**`GET /api/presence-validations`**

| Query | Default | Description |
|-------|---------|-------------|
| `status` | `pending` | `pending` \| `approved` \| `rejected` |
| `session_id` | — | `planning_students.id` |

**Auth:** any user with **`company_id`** (read).

**Response:** includes nested **`studentPresence`** (`note`, `remarks`, locks, …).

### 2.2 Approve / reject (same page access as Courses & notes)

- **`PATCH /api/presence-validations/:id/approve`** — no body.
- **`PATCH /api/presence-validations/:id/reject`** — `{ "rejectionReason": "string" }`.

**Auth:** user’s roles must have **`role_pages`** for **`COURSES_NOTES_PAGE_ROUTE`** (default frontend route **`/student-notes`**).

### 2.3 Edit note while pending (not stored on validation table)

The grade lives on **`student_presence`**. There is **no** `note` column on **`student_presence_validation`**.

- **`PATCH /api/presence-validations/:id/note`**

```json
{
  "note": 14.5,
  "remarks": "Optional; at least one of note / remarks required"
}
```

**Rules:** only while **`status === "pending"`**. Same **page route** guard as approve/reject. Use this from **Courses & notes** (edit icon) instead of **`PATCH /student-presence`** when notes are already teacher-locked.

### 2.4 Student Notes page vs Courses & notes

- **Student Notes** + **Validate notes (final)** → creates **pending** validations and locks notes.
- **Courses & notes** → scholarity edits (**`/note`**), **approve**, **reject**, then **aggregates** / **sync**.

---

## 3. Session details table (merge dashboard + validations)

Use **`GET /api/student-reports/dashboard`** (`class_id`, `school_year_id`, `school_year_period_id`, optional `period_label`) for **`presences`** + **`sessions`**.

Merge validations: **`GET /api/presence-validations?session_id=<planningId>`** (possibly three calls for `pending` / `approved` / `rejected`) keyed by **`student_presence_id`**.

**Actions:**

| UI | API |
|----|-----|
| Approve | `PATCH .../approve` with validation **`id`** |
| Reject | `PATCH .../reject` |
| Edit note | `PATCH .../note` while **pending** |

---

## 4. Aggregates tab (backend enforced)

**`GET` or `POST`** **`/api/student-reports/course-notes-aggregates`**

- Only **`student_presence`** rows with an **`approved`** validation row are included.
- Response **`filters.only_approved_presence_validation`** is **`true`** (for debugging/UI).

**Frontend:** you no longer need to filter pending/rejected client-side for this endpoint. **Sync to report details** should use this payload (or equivalent server truth).

---

## 5. Report details batch

**`POST /api/student-report-details/batch`** with **`student_report_id`** and **`details[]`**.  
Build lines from aggregate output so they stay aligned with **approved-only** notes.

---

## 6. Who can do what

| Action | Rule |
|--------|------|
| **`student-presence`** CRUD | Existing attendance / lock rules |
| **GET** **`presence-validations`** | Same company |
| **PATCH** **`note` / approve / reject** | **`role_pages`** includes **`COURSES_NOTES_PAGE_ROUTE`** (default **`/student-notes`**) |
| **Aggregates / report batch** | Your JWT + route rules |

---

## 7. Quick reference

| Goal | Method & path |
|------|----------------|
| Teacher finalize notes + create pending validations | `POST /api/students-plannings/:id/notes/validate` |
| List validations | `GET /api/presence-validations?session_id=` |
| Edit note (pending) | `PATCH /api/presence-validations/:id/note` |
| Approve / reject | `PATCH .../approve` · `PATCH .../reject` |
| Aggregates (approved only) | `GET` or `POST` `/api/student-reports/course-notes-aggregates` |
| Report lines | `POST /api/student-report-details/batch` |

---

## 8. Enum

**`student_presence_validation.status`:** `"pending"` | `"approved"` | `"rejected"`

---

## 9. Copy-paste prompt for frontend / AI assistant

Use this in Cursor (or similar) so the UI matches the backend.

```text
Our Nest API behavior for Courses & notes:

1) student_presence_validation rows are created ONLY after the teacher calls POST /api/students-plannings/:planningId/notes/validate (Validate notes final) OR when scholarity sets notes_validated_controleur on the planning. No validation row on first student_presence insert.

2) The note value always lives on student_presence. To let scholarity correct a grade while validation is pending, use PATCH /api/presence-validations/:validationId/note with body { note?: number, remarks?: string } (at least one field). Do NOT use PATCH /api/student-presence for that when notes_locked is true.

3) PATCH /api/presence-validations/:id/approve and .../reject use the same page permission as Courses & notes (role_pages for COURSES_NOTES_PAGE_ROUTE, default frontend path /student-notes).

4) GET/POST /api/student-reports/course-notes-aggregates only includes presences where student_presence_validation.status === 'approved'. The Aggregates tab and "Sync to report details" must rely on this API; do not re-include pending or rejected rows client-side.

5) Session details: merge GET /api/student-reports/dashboard presences with GET /api/presence-validations?session_id=planningId (query status pending/approved/rejected as needed). Approve/reject/edit use validation id from that list.

Implement or adjust the React (or our stack) pages: Student Notes (validate final), Courses & notes Session details (badges, edit note via PATCH .../note, approve/reject), and Aggregates (no extra filtering beyond what API returns).
```
