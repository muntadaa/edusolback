# Frontend guide: Required documents & student document audit (Settings)

This **Settings** area covers **two** features that share the **same permission**:

1. **Templates** — define which documents apply per program / specialization / level (`/api/required-docs/...`).
2. **Per-student audit** — list rows in the **`auditor`** table, upload files on behalf of a student, verify or unverify (`/api/auditor/...`).

**Frontend route:** `/settings/required-documents` (must match backend page access; see below).

**API base path:** `/api`  
**Auth:** `Authorization: Bearer <JWT>` on every request.

---

## 1. Permissions (Page access only — no special “auditor” role)

| Item | Detail |
|------|--------|
| **Single page route** | `/settings/required-documents` |
| **Who can use the APIs** | Any authenticated user whose **role** has **Page access** to **`/settings/required-documents`**. There is **no** separate backend check for a role named `auditor`. |
| **Admin users** | Users with the **`admin`** role can call these APIs the same way as other global pages (no extra role–page row required). |
| **403** | The JWT is valid but the user’s roles are not linked to **`/settings/required-documents`** in **Settings → Page access**. Fix: grant that page to the role (same as Events, PDF layout, etc.). |

Staff who can open this Settings screen can **configure templates**, **list student document rows**, **upload** a file for a student, and **verify** or **unverify** — all gated only by this page.

Optional env on the server (only if your app uses a different path):

- `REQUIRED_DOCS_SETTINGS_PAGE_ROUTE` — must match the route in Page access, the SPA route, **and** is used for both **required-docs** and **auditor** APIs.

---

## 2. Data model (what one row is)

Each record is one line in the **Required documents** table:

| Field | Type | Meaning |
|--------|------|--------|
| `id` | number | Primary key (returned by API). |
| `company_id` | number | **Do not send** — taken from the logged-in user. |
| `program_id` | number \| null | If set: applies to that program. If **omitted** on create (or **null** on update): **wildcard** (“any program” for the other dimensions). |
| `specialization_id` | number \| null | Same idea: specific specialization vs wildcard. |
| `level_id` | number \| null | Same idea: specific level vs wildcard. |
| `title` | string | **Document name** shown to users (e.g. “CIN copy”, “Photo”). Max 255 chars. |
| `is_required` | boolean | `true` = mandatory; `false` = optional. Default on create: `true` if omitted. |
| `created_at` / `updated_at` | ISO date | Read-only. |

**Rule:** At least **one** of `program_id`, `specialization_id`, or `level_id` must be non-null on **create**. IDs must belong to the company and be consistent (e.g. level belongs to specialization and program when you send more than one).

**Duplicates:** Same company + same scope (including NULLs as wildcards) + same **trimmed** `title` is rejected.

---

## 3. REST API — templates (`required-docs`)

| Method | URL | Purpose |
|--------|-----|--------|
| `GET` | `/api/required-docs` | List rows (filters + search). |
| `GET` | `/api/required-docs/:id` | Get one row. |
| `POST` | `/api/required-docs` | Create. |
| `PATCH` | `/api/required-docs/:id` | Update (partial). |
| `DELETE` | `/api/required-docs/:id` | Delete. |

Swagger tag: **Required documents** (if Swagger is enabled).

---

## 3b. REST API — student document audit (`auditor`)

Same **Page access** as §1 (`/settings/required-documents`). Swagger tag: **Auditor**.

| Method | URL | Purpose |
|--------|-----|--------|
| `GET` | `/api/auditor/documents?student_id=&status=` | List **`auditor`** rows for one student. `status` optional: `pending` \| `uploaded` \| `verified`. |
| `GET` | `/api/auditor/documents/:id` | One row. |
| `POST` | `/api/auditor/documents/sync` | Body: `student_id`, `program_id`, `specialization_id`, `level_id` — creates missing rows from templates (manual backfill). |
| `PATCH` | `/api/auditor/documents/:id/verify` | Mark **verified** (file **not** required — e.g. paper checked). Sets `verified_by` / `verified_at`. |
| `PATCH` | `/api/auditor/documents/:id/unverify` | Clears verification; status becomes **`uploaded`** if a file exists, else **`pending`**. |
| `POST` | `/api/auditor/documents/:id/upload` | Multipart field **`file`** (PDF or image). Fails if row is already **verified** (unverify first). |

**File URLs:** responses may include `file_path` like `/uploads/auditor/{companyId}/...` (already under your static `/uploads` serving).

**UI suggestion:** second tab or section **“Student documents”** on the same Settings page: pick a student (or deep-link from student profile), then list → upload / verify / unverify.

---

## 4. List with filters (main table)

**Request**

```http
GET /api/required-docs?program_id=1&specialization_id=2&level_id=3&search=cin
```

**Query parameters (all optional)**

| Param | Effect |
|--------|--------|
| `program_id` | Keeps rows where `program_id` is **this id** **or** **NULL** (wildcard for “any program” in that dimension). |
| `specialization_id` | Same pattern for specialization. |
| `level_id` | Same pattern for level. |
| `search` | `title` **contains** this substring (SQL `LIKE %search%`). |

**Response:** JSON array of objects with `id`, `company_id`, `program_id`, `specialization_id`, `level_id`, `title`, `is_required`, `created_at`, `updated_at`.

**UI tips**

- Drive filters from your existing **Programs / Specializations / Levels** dropdowns (same APIs you use elsewhere).
- Combine filters with a **search** input bound to `search`.
- Show **Required** vs **Optional** from `is_required` (badge or toggle in edit form).

---

## 5. Create (Add row)

**Request**

```http
POST /api/required-docs
Content-Type: application/json
```

**Body examples**

Program only (document applies to whole program, any spec/level under it):

```json
{
  "program_id": 1,
  "title": "CIN copy",
  "is_required": true
}
```

Program + specialization + level (narrowest):

```json
{
  "program_id": 1,
  "specialization_id": 2,
  "level_id": 3,
  "title": "Diploma",
  "is_required": false
}
```

**Fields**

| Field | Required on create | Notes |
|--------|---------------------|--------|
| `title` | Yes | Non-empty string. |
| `program_id` | One of the three ids | At least one of `program_id`, `specialization_id`, `level_id`. |
| `specialization_id` | (see above) | |
| `level_id` | (see above) | |
| `is_required` | No | Default `true`. Send explicit `false` for optional. |

**Important:** Send real **JSON booleans** (`true` / `false`), not strings.

---

## 6. Update

**Request**

```http
PATCH /api/required-docs/:id
Content-Type: application/json
```

**Body:** any subset of fields. Omitted fields stay unchanged.

To turn a dimension into a **wildcard**, send **`null`** for that id:

```json
{
  "program_id": 1,
  "specialization_id": null,
  "level_id": null,
  "title": "CIN copy (updated)",
  "is_required": true
}
```

After update, the row must still satisfy “at least one non-null scope id” and duplicate title rules.

---

## 7. Delete

```http
DELETE /api/required-docs/:id
```

No body. **204** or success payload depending on global interceptor — handle **404** if id is wrong or another company.

---

## 8. Settings tab UX checklist

1. Add **Settings** route **`/settings/required-documents`**, nav label **Settings - Required Documents** (shorter label in menu is OK; **route string** must match Page access + backend).
2. **Tab A — Templates:** `GET /api/required-docs` with filters/search; table with title, scope, required badge; create/edit/delete as in §5–§7.
3. **Tab B — Student audit (same page, same permission):** student picker → `GET /api/auditor/documents?student_id=`; show status, title, `is_required_snapshot`, file link, actions **Verify** / **Unverify** / **Upload**.
4. Optional **Sync** button calling `POST /api/auditor/documents/sync` if rows are missing after a level change (backend also syncs on class-student assignment when possible).
5. **Upload:** `POST /api/auditor/documents/:id/upload` with `multipart/form-data` and field name **`file`**.
6. Grant **`/settings/required-documents`** in **Page access** for every role that should manage **either** templates **or** student uploads/verification — **one** permission covers both.

---

## 9. Error handling

| Status | Typical cause |
|--------|----------------|
| **400** | Templates: missing `title`, bad scope, duplicate title. Auditor: bad multipart, upload on verified row without unverify first. |
| **401** | Missing or invalid JWT. |
| **403** | No Page access to `/settings/required-documents` (applies to **both** `required-docs` and `auditor` APIs). |
| **404** | Unknown `id`, student not in company, or row not found. |

Display `message` or `message[]` from the error body when present.
