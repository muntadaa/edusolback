# Frontend Troubleshooting: Empty `student_payment_details`

Use this checklist when a student is assigned to a class but no payment details are generated.

This guide is API-first (frontend-friendly), no direct SQL required.

## 1) Expected backend trigger logic

`student_payment_details` are generated when:

1. Student is assigned to a class (`class_students` row exists, active).
2. Student is active (`student.status = 1`).
3. There are matching level pricings for that class:
   - same `company_id`
   - same `level_id`
   - same `school_year_id`
   - pricing not deleted (`status != -2`)

If one condition is missing, `generated_count` will be `0`.

## 2) Fast diagnosis flow (frontend)

Given a `studentId`:

1. Trigger generation manually:
   - `POST /api/student-payment-details/generate/:studentId`
2. Read the response.
3. Then fetch details:
   - `GET /api/student-payment-details?student_id=:studentId`
4. If still empty, check each prerequisite below.

## 3) Required checks

## A. Student is active

Call:

- `GET /api/students/:id`

Expected:

- `status = 1`

If status is `2` (pending), no payment details will be generated.

## B. Student is assigned to a class

Call:

- `GET /api/class-student?student_id=:studentId`

Expected:

- at least one active assignment
- assignment has valid `class_id`

## C. Class has level + school year

From the class assignment, get class info and verify:

- `level_id` exists
- `school_year_id` exists

## D. Matching level pricings exist

Call:

- `GET /api/level-pricings?level_id=:levelId&school_year_id=:schoolYearId`

Expected:

- at least one pricing in response

## E. Pricing has usable effective amount/title

For each matching pricing, backend needs:

- title + amount directly on pricing, or
- linked rubrique with title + amount

If effective title is empty or effective amount <= 0, that pricing is skipped.

## 4) Common frontend mistakes

1. Assigning student while still pending (`status = 2`) and never activating.
2. Activating a user that is not linked to this student email/company.
3. Creating level pricings for another school year than the class.
4. Creating level pricings for another level than the class.
5. Sending incomplete pricing data (`title`/`amount` missing without rubrique).

## 5) Correct frontend flow (recommended)

1. Create student.
2. Ensure invitation email is sent to the same student email.
3. Student sets password (account activation flow).
4. Confirm student becomes active (`status = 1`).
5. Assign student to class.
6. If needed, call manual generation endpoint once.
7. Load:
   - `GET /api/student-payment-details?student_id=:id`
   - `GET /api/student-payment-details/summary?student_id=:id`

## 6) What to show in UI when generation returns 0

When `POST /api/student-payment-details/generate/:studentId` returns:

```json
{
  "student_id": 123,
  "generated_count": 0,
  "skipped_reason": "Student is not active"
}
```

Show a clear action hint:

- "Student is pending. Activate account first."
- button to refresh status
- button to re-run generation

## 7) Suggested frontend debug panel (optional)

For finance/admin screens, add a collapsible "Generation checks" card:

- Student status
- Class assignment count
- Class level/year
- Matching level pricing count
- Last generation response (`generated_count`, `skipped_reason`)

This removes guesswork when support teams debug billing issues.
