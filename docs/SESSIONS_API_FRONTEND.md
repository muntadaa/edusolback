# Sessions (Planning) API – Frontend Reference

Everything the frontend needs to list, show, and manage **sessions** (students-plannings).

---

## Base URL & Auth

- **Base:** `GET/POST/PATCH/DELETE` → `/api/students-plannings`
- **Auth:** Bearer JWT. Send header: `Authorization: Bearer <token>`
- **Scope:** All endpoints are scoped to the authenticated user’s `company_id`.

---

## 1. List sessions (for calendar / list view)

**`GET /api/students-plannings`**

### Query parameters (all optional)

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (min 1). Default: 1 |
| `limit` | number | Items per page (min 1, no max). Omit or use large value (e.g. 1000) for “all in range” (calendar). Default: 10 when paginating |
| `order` | `'ASC'` \| `'DESC'` | Sort by `date_day` then `hour_start`. Default: `ASC` |
| `status` | number | Filter by session status. Allowed: -2, -1, 0, 1, 2 |
| `teacher_id` | number | Filter by teacher ID |
| `class_id` | number | Filter by class ID |
| `class_room_id` | number | Filter by classroom ID |
| `course_id` | number | Filter by course ID |
| `planning_session_type_id` | number | Filter by planning session type |
| `school_year_id` | number | Filter by school year |
| `class_course_id` | number | Filter by class-course (e.g. modal) |
| `date_day_from` | string | Start of date range (inclusive). Format: `YYYY-MM-DD` |
| `date_day_to` | string | End of date range (inclusive). Format: `YYYY-MM-DD` |

**Calendar usage:** use `date_day_from`, `date_day_to` and omit `limit` (or use a large `limit`) to get all sessions in the visible range.

**Example – week view:**  
`GET /api/students-plannings?date_day_from=2026-01-26&date_day_to=2026-02-01`

**Example – filter by teacher and class:**  
`GET /api/students-plannings?teacher_id=7&class_id=3`

**Example – paginated list:**  
`GET /api/students-plannings?page=1&limit=20&order=ASC`

### List response shape

```ts
{
  data: Session[];   // array of session objects (see below)
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

---

## 2. Get one session (detail)

**`GET /api/students-plannings/:id`**

Returns a single session with the same structure as each item in `data` above. Single-session response includes deeper relations: `classCourse.level`, `level.specialization`, `specialization.program`, `classCourse.module`.

---

## 3. Session object (for list and single)

Each session in `data` (and from GET by id) looks like this. Nested objects are included when returned by the API (list and single both load `teacher`, `course`, `class`, `classRoom`, `company`, `planningSessionType`, `schoolYear`, `classCourse`).

```ts
interface Session {
  id: number;
  period: string;
  teacher_id: number;
  teacher: { id: number; /* ...other teacher fields */ };
  course_id: number;
  course: { id: number; /* ...other course fields */ };
  class_id: number;
  class: { id: number; /* ...other class fields */ };
  class_room_id: number | null;
  classRoom: { id: number; /* ... */ } | null;
  planning_session_type_id: number | null;
  planningSessionType: { id: number; /* ... */ } | null;
  date_day: string;           // "YYYY-MM-DD"
  hour_start: string;         // time e.g. "09:00:00"
  hour_end: string;           // time e.g. "10:30:00"
  company_id: number;
  company: { id: number; /* ... */ };
  school_year_id: number | null;
  schoolYear: { id: number; /* ... */ } | null;
  class_course_id: number | null;
  classCourse: { id: number; /* level, module, ... */ } | null;

  status: number;             // session status (see below)
  is_duplicated: boolean;
  duplication_source_id: number | null;
  has_notes: boolean;         // or hasNotes

  // Validation (legacy numeric, kept in sync)
  presence_validation_status: number;  // 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED
  notes_validation_status: number;     // 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED

  // Validation (source of truth – use these for UI)
  presence_validated_teacher: boolean;
  presence_validated_controleur: boolean;
  notes_validated_teacher: boolean;
  notes_validated_controleur: boolean;

  created_at: string;         // ISO date
  updated_at: string;         // ISO date
}
```

**Note:** API may return snake_case (`has_notes`, `presence_validated_teacher`, etc.). Frontend can normalize to camelCase if desired.

---

## 4. Session status and validation constants

**Session `status` (numeric):**

- `-2` = deleted (filtered out in list/detail)
- `-1` = (reserved)
- `0` = draft
- `1` = activated (e.g. after teacher validates presence)
- `2` = default/other

**Validation status (numeric, legacy):**

- `0` = DRAFT  
- `1` = TEACHER_VALIDATED  
- `2` = LOCKED (irreversible)

**Validation booleans (use for UI):**

- `presence_validated_teacher` → teacher has validated presence  
- `presence_validated_controleur` → controller has validated presence (only after teacher)  
- `notes_validated_teacher` → teacher has validated notes (only when `has_notes`)  
- `notes_validated_controleur` → controller has validated notes (only after teacher)

Once set to `true`, these booleans cannot be reverted to `false`.

---

## 5. Other endpoints (actions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/students-plannings` | Create a session. Body: see create DTO (teacher_id, class_id, course_id, date_day, hour_start, hour_end, etc.). |
| **PATCH** | `/api/students-plannings/:id` | Update session (including validation booleans with irreversibility rules). |
| **DELETE** | `/api/students-plannings/:id` | Delete session. |
| **POST** | `/api/students-plannings/:id/activate` | Activate session: set status to activated and lock presence. |
| **POST** | `/api/students-plannings/:id/notes/validate` | Lock all notes for this session. Allowed only when `has_notes === true`. |
| **POST** | `/api/students-plannings/duplicate` | Duplicate planning (week / frequency / recurring). Body: `DuplicatePlanningDto` (e.g. `planning_id`, `type`, date range). |

---

## 6. Showing sessions – checklist

- **List/calendar:** `GET /api/students-plannings` with:
  - `date_day_from` + `date_day_to` for the visible range
  - optional `teacher_id`, `class_id`, `course_id`, etc.
  - no `limit` or high `limit` for full range
- **Sort:** `order=ASC` or `order=DESC` (by date and time).
- **Detail:** `GET /api/students-plannings/:id` for one session with full relations.
- **Response:** Use `data` for the list and `meta` for pagination (when using `limit`).
- **UI state:** Use `presence_validated_teacher`, `presence_validated_controleur`, `notes_validated_teacher`, `notes_validated_controleur` and `has_notes` for badges and actions (activate, validate notes).

This document gives the frontend everything needed to show and manage sessions.
