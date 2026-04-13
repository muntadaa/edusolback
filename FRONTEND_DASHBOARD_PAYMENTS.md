## Payments dashboard – frontend guide

Base URL for accounting APIs: `"/api"` (all paths below assume this base).

---

## 1. Tab “Global payments”

### Endpoint

- **GET** `/student-payment-details/summary`
- **Auth:** JWT (`Authorization: Bearer ...`)

### Query parameters (optional filters)

Same as ledger list:

- `school_year_id` – focus on a specific year
- `class_id`
- `level_id`
- `student_id`
- `rubrique_id`
- `level_pricing_id`

### Response

```ts
interface PaymentsSummary {
  total_lines: number;      // number of ledger lines
  total_due: number;        // total TTC invoiced
  total_allocated: number;  // total paid (allocated)
  total_remaining: number;  // total_due - total_allocated
}
```

### UI idea

- Show 3–4 KPI cards:
  - **Total invoiced** = `total_due`
  - **Total paid** = `total_allocated`
  - **Total remaining** = `total_remaining`
  - Optional: **# obligations** = `total_lines`
- Add a filter row (at least `school_year_id`) and refetch summary when filters change.

---

## 2. Tab “Students with remaining balance”

This tab shows per-student aggregates and lets the user send email reminders.

### 2.1 Debtors list

### Endpoint

- **GET** `/student-payment-details/debtors`
- **Auth:** JWT

### Query parameters

All standard ledger filters are supported and applied before aggregation:

- Pagination:
  - `page?: number` (default 1)
  - `limit?: number` (default 20)
- Filters:
  - `school_year_id?: number`
  - `class_id?: number`
  - `level_id?: number`
  - `student_id?: number`
  - `rubrique_id?: number`
  - `level_pricing_id?: number`
  - `status?: -2 | -1 | 0 | 1 | 2`

### Response

```ts
interface StudentDebtorRow {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_due: number;
  total_allocated: number;
  total_remaining: number;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
```

Only students with `total_remaining > 0` are returned, sorted by highest `total_remaining` first.

### UI idea

Render a table:

- **Student**: `first_name + " " + last_name`
- **Email**
- **Total due**
- **Total paid** = `total_allocated`
- **Remaining** = `total_remaining`
- **Actions**:
  - “Send reminder” button (single)
  - Checkbox per row for bulk select

Add filters (school year, level, class) above the table, bound to the query parameters.

---

## 3. Payment reminder emails

The backend exposes a bulk email endpoint for reminders.

### Endpoint

- **POST** `/student-payment-details/payment-reminders`
- **Auth:** JWT

### Request body

```ts
interface StudentPaymentReminderBody {
  studentIds: number[];     // at least 1
  school_year_id?: number;  // optional: restrict calculation to this year
}
```

- When `school_year_id` is provided, remaining amounts are computed only for that year.
- If a student has no remaining balance at send time, they are skipped with a clear reason.

### Response

```ts
interface ReminderResult {
  sent: number[];                         // student IDs where email was sent
  failed: { id: number; reason: string }[]; // IDs that could not be sent and why
}
```

### Behaviour notes

For each `studentId`:

- The backend:
  - Validates the student belongs to the authenticated company and has an email.
  - Reuses the summary logic to compute:
    - `total_due`
    - `total_allocated`
    - `total_remaining`
  - If `total_remaining <= 0`, no email is sent for that student (added to `failed`).
  - Otherwise, it sends a **styled HTML email** using the `payment-reminder` template.

Email template variables:

- `companyName`
- `studentName`
- `totalDue`
- `totalPaid`
- `totalRemaining`

---

## 4. Frontend flow per tab

### Tab 1 (Global)

1. Load defaults (e.g. `school_year_id` = current year).
2. Call `GET /student-payment-details/summary` with filters.
3. Display summary cards.

### Tab 2 (Debtors)

1. Keep local filter state: `school_year_id`, `class_id`, `level_id`, search, `page`, `limit`.
2. Call `GET /student-payment-details/debtors` with those query params.
3. Render table from `data`.
4. Allow:
   - **Single send**: on row action:
     - `POST /student-payment-details/payment-reminders` with `studentIds: [row.student_id]` and current `school_year_id`.
   - **Bulk send**: on “Send to selected”:
     - Collect `studentIds` from checked rows.
     - Call the same endpoint once with the array.
5. Show a toast/notification based on `sent.length` and `failed` reasons.

