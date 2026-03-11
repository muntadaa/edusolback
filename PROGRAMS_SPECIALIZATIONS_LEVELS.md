## Programs, Specializations & Levels – Duration & Accreditation

This document explains how **duration** and **accreditation** work for `Program`, `Specialization`, and `Level` in the backend, and how the frontend/mobile app should use these fields.

---

### 1. Shared concepts

All three entities now support:

- **Duration**
  - Field name: `durationMonths: number | null`
  - Meaning: total duration in **months** for that entity.

- **Accreditation** (whoever needs it can use it)
  - `accreditationDate: string | null` – ISO date, e.g. `'2026-01-01'`
  - `accreditationText: string | null` – free text (notes, reference, decree number, etc.)
  - `accreditationDocument: string | null` – path/URL to a PDF or image (e.g. uploaded accreditation document)

Backend does **not** enforce where accreditation must live; the client (web/app) can decide whether to set it at:

- Program level,
- Specialization level,
- Level level,
- Or any combination of those.

---

### 2. Entity fields (backend)

#### 2.1 Level (`levels` table, `Level` entity)

Key fields:

- `durationMonths: number | null` (DB column `duration_months`)
- `accreditationDate: Date | null` (DB column `accreditation_date`)
- `accreditationText: string | null` (DB column `accreditation_text`)
- `accreditationDocument: string | null` (DB column `accreditation_document`)

DTO:

- `CreateLevelDto` / `UpdateLevelDto`:
  - `durationMonths?: number`
  - `accreditationDate?: string` (ISO date)
  - `accreditationText?: string`
  - `accreditationDocument?: string`

#### 2.2 Specialization (`specializations` table, `Specialization` entity)

Key fields:

- `durationMonths: number | null` (DB column `duration_months`)
- `accreditationDate: Date | null`
- `accreditationText: string | null`
- `accreditationDocument: string | null`

DTO:

- `CreateSpecializationDto` / `UpdateSpecializationDto`:
  - `durationMonths?: number`
  - `accreditationDate?: string` (ISO date)
  - `accreditationText?: string`
  - `accreditationDocument?: string`

#### 2.3 Program (`programs` table, `Program` entity)

Key fields:

- `durationMonths: number | null` (DB column `duration_months`)
- `accreditationDate: Date | null`
- `accreditationText: string | null`
- `accreditationDocument: string | null`

DTO:

- `CreateProgramDto` / `UpdateProgramDto`:
  - `durationMonths?: number`
  - `accreditationDate?: string` (ISO date)
  - `accreditationText?: string`
  - `accreditationDocument?: string`

---

### 3. Duration calculation logic

#### 3.1 Level

- `Level.durationMonths` is **always set manually** (from the client).
- There is **no automatic** calculation on the backend for levels.

#### 3.2 Specialization duration

Specialization duration can be:

- **Stored explicitly** via `durationMonths` when creating/updating, or
- **Computed by the backend from its levels** when not set.

Backend behaviour:

- When calling `GET /specializations/:id`, if:
  - `durationMonths` is `null` or `0`, and
  - `levels` are loaded on that specialization,
  - then the service sets:

    ```ts
    specialization.durationMonths =
      sum(level.durationMonths || 0) over all levels belonging to that specialization
    ```

- When calling `PATCH /specializations/:id`:
  - If the payload **does not include** `durationMonths`, and
  - the specialization instance already has levels loaded,
  - the service recomputes `durationMonths` from levels before saving.
  - If the payload **does include** `durationMonths`, that value is used and not overridden in that request.

#### 3.3 Program duration

Program duration can be:

- **Stored explicitly** via `durationMonths`, or
- **Computed by the backend from its specializations** when not set.

Backend behaviour:

- When calling `GET /programs/:id`, if:
  - `durationMonths` is `null` or `0`, and
  - `specializations` are loaded on that program,
  - then the service sets:

    ```ts
    program.durationMonths =
      sum(specialization.durationMonths || 0) over all specializations belonging to that program
    ```

- When calling `PATCH /programs/:id`:
  - If the payload **does not include** `durationMonths`, and
  - the program instance has specializations loaded,
  - the service recomputes `durationMonths` from specializations before saving.
  - If the payload **does include** `durationMonths`, that explicit value wins.

**Important for frontend:**  
On detail endpoints (`GET /programs/:id`, `GET /specializations/:id`), you can treat `durationMonths` as a reliable “final duration” value:

- Either it’s explicitly stored, or
- It’s the sum of children levels/specializations.

---

### 4. Frontend usage guidelines

#### 4.1 Creation forms

On **create** screens:

- **Level (create)**:
  - Show input for `durationMonths` (months).
  - Optionally allow setting accreditation fields, but they are not mandatory.

- **Specialization (create)**:
  - Show `durationMonths` if you want manual control, or omit it so the backend can compute from levels later.
  - Do **not** require accreditation fields during create (they are primarily for update).

- **Program (create)**:
  - Same as specialization:
    - `durationMonths` optional (backend can compute from specializations),
    - Accreditation fields optional and usually set later.

#### 4.2 Edit / detail screens

On **edit** screens:

- **Level edit**:
  - Duration:
    - Editable `durationMonths` field.
  - Accreditation:
    - Editable `accreditationDate`, `accreditationText`, `accreditationDocument` **only on update**.

- **Specialization edit**:
  - Duration:
    - Show `durationMonths` coming from API.
    - You may:
      - Allow editing it directly, or
      - Treat it as read-only and let the backend recompute from levels (by omitting it in PATCH).
  - Accreditation:
    - Allow editing `accreditationDate`, `accreditationText`, `accreditationDocument` **only on update**.

- **Program edit**:
  - Duration:
    - Same behaviour as specialization (can be explicit or derived from specializations).
  - Accreditation:
    - Allow editing the three accreditation fields only on update.

#### 4.3 Recommended UX rules

- **Duration**:
  - Level: always set from the UI.
  - Specialization:
    - Option A (auto): display computed value; don’t send `durationMonths` on update.
    - Option B (manual): allow editing and send `durationMonths` explicitly.
  - Program: same as specialization.

- **Accreditation (where to set it)**:
  - You are free to put accreditation on:
    - Program, or
    - Specialization, or
    - Level, or
    - Any combination.
  - The backend **does not propagate** accreditation automatically; any “inheritance” logic is purely UI.

Example UI inheritance for level detail:

1. Prefer `level` own accreditation.
2. If empty, fallback to `specialization` accreditation.
3. If still empty, fallback to `program` accreditation.

You can implement this on the client side as:

```ts
function getAccreditation(source?: {
  accreditationDate?: string | null;
  accreditationText?: string | null;
  accreditationDocument?: string | null;
}) {
  if (!source) return null;
  if (!source.accreditationDate && !source.accreditationText && !source.accreditationDocument) {
    return null;
  }
  return source;
}

const levelAcc = getAccreditation(level);
const specAcc = getAccreditation(level.specialization);
const programAcc = getAccreditation(level.specialization?.program);

const effectiveAccreditation = levelAcc || specAcc || programAcc;
```

---

### 5. Notes about translations (i18n)

- **Field names in the API** (`durationMonths`, `accreditationDate`, `accreditationText`, `accreditationDocument`) are **technical keys**, not translated.
- **Frontend labels and messages** should be translated via your normal i18n system.

Recommended translation keys (examples):

- `program.duration.label` → "Program duration"
- `specialization.duration.label` → "Specialization duration"
- `level.duration.label` → "Level duration"
- `accreditation.date.label` → "Accreditation date"
- `accreditation.text.label` → "Accreditation details"
- `accreditation.document.label` → "Accreditation document"
- `duration.unit.months` → "months"

The backend always works in **months** and **ISO dates**; the frontend is responsible for:

- Converting months into whatever user-visible format you need (e.g. `"3 months"`, `"1 year 6 months"`, etc., localized).
- Formatting/parsing `accreditationDate` according to locale, while sending/receiving ISO strings to/from the API.

