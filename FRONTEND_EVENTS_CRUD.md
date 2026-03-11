# Frontend: Events CRUD guide

Events are used for holidays, exams, closures, etc. **Blocking** events prevent creating planning sessions on those dates (see [FRONTEND_BLOCKING_EVENTS.md](./FRONTEND_BLOCKING_EVENTS.md) for greying out days).  
**Create events first** via this CRUD; then use `GET /api/events/blocking` for the calendar and planning date picker.

All endpoints require **JWT** (`Authorization: Bearer <token>`). Base path: **`/api/events`** (global API prefix is `api`).

---

## Event type (enum)

Use these exact values for `type`:

| Value      | Description   |
|-----------|---------------|
| `holiday` | Holiday       |
| `exam`    | Exam period   |
| `event`   | General event |
| `closure` | Closure       |

---

## Endpoints

### 1. List all events

**`GET /api/events`**

- **Response:** `200` – array of events (ordered by `start_date`, then `end_date`, then `id`).

Example response:

```json
[
  {
    "id": 1,
    "title": "Winter break",
    "description": "School closed",
    "start_date": "2025-12-20",
    "end_date": "2025-12-31",
    "type": "holiday",
    "is_blocking": true,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
]
```

---

### 2. Get one event

**`GET /api/events/:id`**

- **Params:** `id` – event ID (number).
- **Response:** `200` – single event object.  
- **Errors:** `404` – event not found.

---

### 3. Create event

**`POST /api/events`**

- **Body (JSON):**

| Field         | Type    | Required | Description |
|---------------|---------|----------|-------------|
| `title`       | string  | Yes      | Max 255 chars. |
| `description` | string  | No       | Free text. |
| `start_date`  | string  | Yes      | Date in **YYYY-MM-DD**. |
| `end_date`    | string  | Yes      | Date in **YYYY-MM-DD**. Must be ≥ `start_date`. |
| `type`        | string  | Yes      | One of: `holiday`, `exam`, `event`, `closure`. |
| `is_blocking` | boolean | No       | If `true`, planning cannot be created on these dates. Default: `true`. |

Example request:

```json
{
  "title": "Mid-term exams",
  "description": "Exams for all classes in semester 1",
  "start_date": "2026-03-15",
  "end_date": "2026-03-20",
  "type": "exam",
  "is_blocking": true
}
```

- **Response:** `201` – created event (same shape as in list/get).

---

### 4. Update event

**`PATCH /api/events/:id`**

- **Params:** `id` – event ID (number).
- **Body (JSON):** Any subset of the create fields. Only sent fields are updated.

| Field         | Type    | Required | Description |
|---------------|---------|----------|-------------|
| `title`       | string  | No       | Max 255 chars. |
| `description` | string  | No       | Free text. |
| `start_date`  | string  | No       | YYYY-MM-DD. |
| `end_date`    | string  | No       | YYYY-MM-DD. |
| `type`        | string  | No       | `holiday` \| `exam` \| `event` \| `closure`. |
| `is_blocking` | boolean | No       | Block planning on these dates or not. |

Example (only change title and end date):

```json
{
  "title": "Mid-term exams (updated)",
  "end_date": "2026-03-22"
}
```

- **Response:** `200` – updated event object.  
- **Errors:** `404` – event not found.

---

### 5. Delete event

**`DELETE /api/events/:id`**

- **Params:** `id` – event ID (number).
- **Response:** `200` – no body (or empty).  
- **Errors:** `404` – event not found.

---

## Suggested flow for the frontend

1. **Events management screen**
   - **List:** `GET /api/events` → show table/list with filters if needed.
   - **Create:** Form with `title`, `description`, `start_date`, `end_date`, `type`, `is_blocking` → `POST /api/events`.
   - **Edit:** Prefill form with `GET /api/events/:id` → submit with `PATCH /api/events/:id`.
   - **Delete:** Confirm → `DELETE /api/events/:id`.

2. **Calendar & planning**
   - After events exist, use **`GET /api/events/blocking`** (optional `from`/`to`) to get blocking events and grey out those days in the calendar and in the “add planning” date picker (see [FRONTEND_BLOCKING_EVENTS.md](./FRONTEND_BLOCKING_EVENTS.md)).

3. **Validation**
   - Dates: `YYYY-MM-DD` only.
   - `end_date` should be ≥ `start_date` (enforce in UI; backend may also validate).
   - `type` must be one of the four enum values.

---

## Quick reference

| Action   | Method | Path                           | Body / Params |
|----------|--------|--------------------------------|----------------|
| List     | GET    | `/api/events`          | —             |
| Get one  | GET    | `/api/events/:id`      | —             |
| Create   | POST   | `/api/events`         | Create body   |
| Update   | PATCH  | `/api/events/:id`      | Partial body  |
| Delete   | DELETE | `/api/events/:id`      | —             |
| Blocking | GET    | `/api/events/blocking` | Optional: `?from=YYYY-MM-DD&to=YYYY-MM-DD` |
