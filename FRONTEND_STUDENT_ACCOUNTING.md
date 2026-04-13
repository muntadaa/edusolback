# Frontend Guide: Student Accounting

This guide explains how the frontend should use the new student accounting APIs.

All endpoints below are under the global API prefix:

- `/api/student-payment-details`
- `/api/student-payment-allocations`
- `/api/student-payments`

All of them require authentication with the normal bearer token.

## 1. Mental model

There are now 3 different backend resources:

### A. `student-payment-details`

This is the **student ledger**.

Each row is an amount the student must pay.

Examples:

- registration fee
- monthly tuition for October
- monthly tuition for November
- exam fee

Important:

- this is the "debit / obligation" side
- rows are generated automatically from class assignment + active student status
- each row keeps a snapshot of title, amount, VAT, and billing mode

### B. `student-payments`

This is the **cash received** from the student.

Examples:

- student paid `500` in cash
- student paid `1200` by bank transfer

Important:

- this is the "credit / receipt" side
- creating a payment automatically allocates it to open ledger lines

### C. `student-payment-allocations`

This is the bridge between the 2 previous tables.

It tells the frontend exactly:

- which receipt paid which ledger line
- how much was allocated

## 2. Recommended frontend pages

The frontend can safely build these screens:

### A. Student ledger page

For one student, show:

- all `student-payment-details`
- due date
- title
- total amount TTC
- allocated amount
- remaining amount
- status / badge

### B. Student payments page

Show:

- all `student-payments`
- payment date
- mode
- reference
- received amount
- allocated amount
- unallocated amount

### C. Payment detail drawer / modal

When clicking a receipt, load allocations and show:

- receipt info
- all lines paid by this receipt
- amount allocated to each line

## 3. Main frontend flow

### Flow 1: student becomes billable

Ledger lines are generated automatically when:

- a student is assigned to a class **and**
- the student is active (`status = 1`)

Also available manually:

- `POST /api/student-payment-details/generate/:studentId`

Use this manual action in frontend as an admin button like:

- `Generate obligations`
- `Regenerate missing obligations`

This endpoint is idempotent for already-created lines.

#### Option A — "Activate" button on Assigned Students (Class screen)

When a student is assigned to a class they appear as **Pending**. Obligations (ledger lines) are **not** generated until the student is **active**.

When the user clicks **Activate** on the "Assigned Students" list for a class:

1. **Call**  
   `PATCH /api/students/:studentId`  
   with body: `{ "status": 1 }`  
   (use the `student_id` of the row, not the class-student assignment id).

2. **Optional**  
   If the UI also stores a status on the class assignment, call  
   `PATCH /api/class-student/:assignmentId`  
   with body: `{ "status": 1 }`  
   so the list shows "Active" instead of "Pending".

3. **After success**  
   The backend automatically generates `student_payment_details` for all current class assignments of that student. Refresh the student finance / ledger if the user has that view open.

**Do not** generate obligations when the student is only assigned; generate only after activating the student (status = 1).

### Flow 2: show the student financial situation

Call:

- `GET /api/student-payment-details?student_id=:id`
- `GET /api/student-payment-details/summary?student_id=:id`
- `GET /api/student-payments?student_id=:id`

This gives:

- line-by-line debt
- totals
- receipts

### Flow 3: register a payment

Call:

- `POST /api/student-payments`

The backend will:

- create the receipt
- auto-allocate it to open ledger lines

Then refresh:

- student ledger
- summary
- payments list
- optionally allocations list

## 4. Endpoints for frontend

## Ledger lines

### `GET /api/student-payment-details`

Purpose:

- list ledger lines with balances

Useful query params:

- `student_id`
- `school_year_id`
- `class_id`
- `level_id`
- `rubrique_id`
- `level_pricing_id`
- `status`
- `search`
- `page`
- `limit`

Important returned fields:

- `id`
- `student_id`
- `school_year_id`
- `class_id`
- `level_pricing_id`
- `rubrique_id`
- `title`
- `amount_ht`
- `vat_rate`
- `amount_ttc`
- `occurrence_index`
- `occurrences`
- `every_month`
- `due_date`
- `period_label`
- `allocated_amount`
- `remaining_amount`

Typical frontend usage:

- ledger table for one student
- filter by school year
- filter by rubrique

### `GET /api/student-payment-details/summary`

Purpose:

- get totals for the current filter

Useful query params:

- same filters as `GET /api/student-payment-details`

Response shape:

```json
{
  "total_lines": 6,
  "total_due": 7200,
  "total_allocated": 2500,
  "total_remaining": 4700
}
```

Use this for:

- top summary cards
- debt totals
- quick student financial overview

### `GET /api/student-payment-details/:id`

Purpose:

- get one ledger line with computed balances

### `POST /api/student-payment-details/generate/:studentId`

Purpose:

- generate missing obligations for one student

Suggested frontend usage:

- admin action button
- retry action after pricing/class corrections

Example response:

```json
{
  "student_id": 45,
  "generated_count": 4
}
```

Or if student is not active:

```json
{
  "student_id": 45,
  "generated_count": 0,
  "skipped_reason": "Student is not active"
}
```

## Receipts

### `GET /api/student-payments/summary` — payment totals (use to cap amount)

Purpose:

- get total due, total allocated, and **remaining due** for a student in a school year so the frontend can **cap the payment amount** and show totals.

Query params (required):

- `student_id` (number)
- `school_year_id` (number)

Example:

```
GET /api/student-payments/summary?student_id=45&school_year_id=3
```

Response:

```json
{
  "total_due": 7200,
  "total_allocated": 2500,
  "remaining_due": 4700,
  "max_payment_allowed": 4700
}
```

Frontend usage:

1. **Add payment form:** When the user opens “Add payment” for a student, call this endpoint with the selected `student_id` and `school_year_id` (e.g. from the current context or dropdown).
2. **Display:** Show something like: “Total due: 7 200 € — Already paid: 2 500 € — Remaining: 4 700 €”.
3. **Cap amount:** Set the max value of the amount input to `max_payment_allowed` (or `remaining_due`). Optionally show a hint: “Maximum: 4 700 €”.
4. **Validation:** If the user enters more than `max_payment_allowed`, show an error before submit, or rely on the API error (see below).
5. **Edit payment:** When editing an existing payment, you can still use this endpoint for the same student/school year; the backend will reject the update if the new total would exceed obligations.

Backend validation:

- The API **rejects** creating or updating a payment if `amount` would exceed the remaining due for that student in that school year.
- Error when over: `400` with message like: `Payment amount (5000) cannot exceed the remaining amount due for this student in this school year (4700). Total obligations: 7200.`
- Error when student has no obligations: `400` with message: `This student has no payment obligations (level pricings) for this school year. Add obligations first or activate the student in a class.`

### `GET /api/student-payments`

Purpose:

- list receipts with allocation summary

Useful query params:

- `student_id`
- `school_year_id`
- `date`
- `mode`
- `status`
- `search`
- `page`
- `limit`

Important returned fields:

- `id`
- `student_id`
- `school_year_id`
- `amount`
- `date`
- `mode`
- `reference`
- `allocated_amount`
- `unallocated_amount`

Notes:

- `amount` = received amount
- `allocated_amount` = part already assigned to ledger lines
- `unallocated_amount` = remaining credit not yet matched

### `POST /api/student-payments`

Purpose:

- create a receipt and auto-allocate it
- **Backend enforces:** `amount` cannot exceed the remaining due for that student in that school year (see `GET .../summary` and validation above).

Recommended request body:

```json
{
  "student_id": 45,
  "school_year_id": 3,
  "amount": 1500,
  "date": "2026-03-04",
  "mode": "Cash",
  "reference": "RCPT-00014"
}
```

Notes:

- Use `amount` (required). Do not send more than `max_payment_allowed` from `GET /api/student-payments/summary` for the same student and school year.
- Optional: `reference`, `mode`; backend may have defaults.

Recommended frontend behavior after success:

1. close modal
2. refresh `student-payment-details`
3. refresh `student-payment-details/summary`
4. refresh `student-payments`

### `PATCH /api/student-payments/:id`

Purpose:

- update a receipt
- backend recalculates allocations

### `DELETE /api/student-payments/:id`

Purpose:

- soft delete a receipt
- linked allocations are removed from active balances

## Allocations

### `GET /api/student-payment-allocations`

Purpose:

- list which receipts paid which ledger lines

Useful query params:

- `student_id`
- `student_payment_id`
- `student_payment_detail_id`
- `status`
- `page`
- `limit`

Important returned fields:

- `id`
- `student_payment_id`
- `student_payment_detail_id`
- `student_id`
- `allocated_amount`
- `allocated_at`

Typical frontend usage:

- receipt detail modal
- ledger line payment history
- audit/history screen

### `GET /api/student-payment-allocations/:id`

Purpose:

- get one allocation row

## 5. How to display statuses in frontend

The backend does not currently send a ready-made financial badge, so the frontend should compute it from the amounts.

For each ledger line:

- if `remaining_amount <= 0` => `Paid`
- if `allocated_amount > 0 && remaining_amount > 0` => `Partially paid`
- if `allocated_amount <= 0` => `Unpaid`

For each receipt:

- if `unallocated_amount <= 0` => `Fully allocated`
- if `allocated_amount > 0 && unallocated_amount > 0` => `Partially allocated`
- if `allocated_amount <= 0` => `Unallocated`

## 6. Why `every_month` matters for frontend

The frontend should keep `every_month` available on ledger lines because it helps explain the billing type:

- `1` means this line comes from a monthly billing logic
- `0` means this line is a one-time or non-monthly repeated obligation

It can be used for:

- badges like `Monthly`
- filtering monthly fees
- showing better labels in the ledger timeline

Important:

- on `student-payment-details`, `every_month` is a snapshot
- do not recompute it on the frontend from current pricing

## 7. Suggested UI order

Best practical order for frontend implementation:

1. Student ledger table
2. Student summary cards
3. Add payment modal
4. Receipt list
5. Allocation history drawer
6. Manual `Generate obligations` action

## 8. Recommended frontend UX

- Always load summary + ledger together for a student page
- After any payment create/update/delete, refresh ledger + summary + receipts
- Do not try to allocate manually in frontend for now
- Treat backend as the source of truth for balances
- Use pagination for list views

## 9. Example student finance page calls

When opening student `45` finance tab:

1. `GET /api/student-payment-details?student_id=45&page=1&limit=20`
2. `GET /api/student-payment-details/summary?student_id=45`
3. `GET /api/student-payments?student_id=45&page=1&limit=20`

When opening a receipt details modal for payment `12`:

1. `GET /api/student-payments/12`
2. `GET /api/student-payment-allocations?student_payment_id=12&page=1&limit=50`

## 10. Important notes

- Use `/api/...` because the backend has a global API prefix
- All endpoints are company-scoped from the authenticated user
- The frontend should not calculate accounting totals as the source of truth
- The frontend should display backend-computed `allocated_amount` and `remaining_amount`
