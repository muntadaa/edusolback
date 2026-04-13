# Pre-inscriptions – Frontend implementation guide

Base URL for pre-inscription APIs: **`/api/preinscriptions`** (or your API base + `preinscriptions`).  
All endpoints below (except the public ones) require **JWT** in the `Authorization` header.

---

## 1. Pre-inscription meetings (commercial ↔ student)

A pre-inscription can have **multiple meetings**. Each meeting has a **date and time** and **meeting notes**. Use these endpoints when the commercial is working with a student (e.g. commercial view / pre-inscription detail).

### Types (TypeScript)

```ts
// Single meeting (API response)
interface PreinscriptionMeeting {
  id: number;
  preinscription_id: number;
  meeting_at: string;     // ISO datetime (e.g. "2025-03-15T14:30:00.000Z")
  meeting_notes: string | null;
  created_at: string;     // ISO datetime
}

// Create body
interface CreateMeetingBody {
  meeting_at: string;     // ISO 8601 date+time (e.g. "2025-03-15T14:30:00" or "2025-03-15T14:30:00.000Z")
  meeting_notes?: string;
}

// Update body (all optional)
interface UpdateMeetingBody {
  meeting_at?: string;
  meeting_notes?: string;
}
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/preinscriptions/:id/meetings` | List all meetings for this pre-inscription (newest first). |
| **POST** | `/preinscriptions/:id/meetings` | Add a meeting. Body: `CreateMeetingBody`. |
| **PATCH** | `/preinscriptions/:id/meetings/:meetingId` | Update a meeting. Body: `UpdateMeetingBody`. |
| **DELETE** | `/preinscriptions/:id/meetings/:meetingId` | Delete a meeting. |

- **Auth:** JWT required. Results are scoped to the user’s company.
- **Errors:** 404 if pre-inscription or meeting not found (or not in company).

### UX suggestions

- On the pre-inscription detail (commercial view), show a **meetings** section: list of meetings (date + time + notes), “Add meeting” button, edit/delete per row.
- After creating/editing a meeting, refetch `GET .../meetings` or update local state.
- Use a datetime picker that outputs ISO 8601 (e.g. `YYYY-MM-DDTHH:mm:ss`) for `meeting_at`.

---

## 2. Workflow and status

Status flow:  
**NEW** → **ASSIGNED_TO_COMMERCIAL** → **COMMERCIAL_REVIEW** → **SENT_TO_ADMIN** → **APPROVED** or **REJECTED** → (if approved) **CONVERTED**.

- **Reassigning commercial:** Allowed from **ASSIGNED_TO_COMMERCIAL** to **ASSIGNED_TO_COMMERCIAL** (same status, different commercial).
- **Commercial evaluation** sets proposed program/specialization/level and moves to **COMMERCIAL_REVIEW**.
- **Submit to admin** is only valid from **COMMERCIAL_REVIEW** (and requires `proposed_level_id`).
- **Admin decision** is only valid when status is **SENT_TO_ADMIN**.

---

## 3. Endpoints quick reference

### List / detail

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/preinscriptions` | JWT | List (paginated). Query: `page`, `limit`, `status`, `country`, `city`, `desired_formation`, etc. |
| GET | `/preinscriptions/:id` | JWT | One pre-inscription (company-scoped). |

### Commercial assignment

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| GET | `/preinscriptions/eligible-commercial-users` | JWT | — | Users that can be assigned as commercial (dropdown). |
| PATCH | `/preinscriptions/:id/assign-commercial` | JWT | `{ "commercialId": number }` | Assign one commercial to one pre-inscription. |
| POST | `/preinscriptions/assign-commercial-bulk` | JWT | `{ "commercialId": number, "preinscriptionIds": number[] }` | Assign one commercial to many. Response: `{ assigned: number[], failed: { id, reason }[] }`. |

### Commercial evaluation and submit

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| PATCH | `/preinscriptions/:id/commercial-evaluation` | JWT | See below | Set proposed program/specialization/level/**school year** + comment; moves to COMMERCIAL_REVIEW. |
| PATCH | `/preinscriptions/:id/submit` | JWT | — | Move to SENT_TO_ADMIN (only from COMMERCIAL_REVIEW; needs `proposed_level_id`, at least one diploma, and **at least one meeting**). |

**Commercial evaluation body** (all optional but at least `proposed_level_id` and `proposed_school_year_id` required before submit):

```ts
{
  commercial_comment?: string;
  proposed_program_id?: number;
  proposed_specialization_id?: number;
  proposed_level_id?: number;
  proposed_school_year_id?: number;
}
```

### Admin decision

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| PATCH | `/preinscriptions/:id/admin-decision` | JWT | See below | Approve or reject (only when status is SENT_TO_ADMIN). |

**Admin decision body:**

```ts
{
  approved: boolean;
  final_program_id?: number;
  final_specialization_id?: number;
  final_level_id?: number;
  final_school_year_id?: number;
  admin_comment?: string;
}
```

---

## 4. When to show which actions (UI)

- **Assign commercial:** Status is **NEW** or **ASSIGNED_TO_COMMERCIAL** (for reassign). Use **eligible-commercial-users** for the dropdown.
- **Meetings:** Anytime the pre-inscription is assigned to a commercial (e.g. **ASSIGNED_TO_COMMERCIAL** or **COMMERCIAL_REVIEW**). Use the meetings endpoints above.
- **Commercial evaluation:** When commercial is done with meetings and wants to set proposal and move to review (e.g. from **ASSIGNED_TO_COMMERCIAL** or **COMMERCIAL_REVIEW**). Then **Submit to administration** from **COMMERCIAL_REVIEW**. The backend requires at least one meeting (and one diploma) before submit; disable or warn if there are no meetings.
- **Admin decision (approve/reject):** Only when status is **SENT_TO_ADMIN**. Hide or disable for other statuses.

---

## 5. Status enum (for filters and UI)

```ts
enum PreInscriptionStatus {
  NEW = 'NEW',
  ASSIGNED_TO_COMMERCIAL = 'ASSIGNED_TO_COMMERCIAL',
  COMMERCIAL_REVIEW = 'COMMERCIAL_REVIEW',
  SENT_TO_ADMIN = 'SENT_TO_ADMIN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED = 'CONVERTED',
}
```

---

You can give this file (or a link to it) to the frontend team so they can implement the meetings list/add/edit/delete and the rest of the pre-inscription workflow against the existing API.
