# Frontend: Pre‑inscriptions guide

Pre‑inscriptions allow prospects to fill a simple public form (before login).  \nEach **company** has a unique **`publicToken`** (generated automatically when the company is created via `POST /api/company`).  \nThis token is returned in the company payload and can be shown in the back‑office so admins can copy it into their public site configuration.  \nThe pre‑inscription page URL should include this token, e.g. `/preinscription/:publicToken`, and the backend will attach records to the right company and expose company data based on it.

Base API paths (global prefix is `api`):

- Company public info: **`/api/company/public/:publicToken`**
- Pre‑inscriptions (internal/admin): **`/api/preinscriptions`**
- Pre‑inscriptions (public): **`/api/preinscriptions/public/:publicToken`**

---

## 1. Fetch company info for the public page

Before showing the form, load company branding and name **based on the company’s public token**.

### `GET /api/company/public/:publicToken` (public)

- **Purpose**: Display the school name/logo/colors on the pre‑inscription page using the company’s `publicToken`.
- **Auth**: none.
- **Response**: company object (at least `name`, `logo`, colors, etc.).

Typical flow:

1. Route like `/preinscription/:publicToken`.\n2. On mount, call `GET /api/company/public/{publicToken}`.\n3. Show `company.name`, logo, and apply brand colors (all coming from the company identified by `publicToken`).

---

## 2. Public pre‑inscription form (create)

This is the main **public** endpoint used by the website form. It will automatically attach the pre‑inscription to the company identified by `publicToken`.

### `POST /api/preinscriptions/public/:publicToken` (public)

- **Params (path)**:
  - `publicToken` – the company’s public token (string).
- **Body (JSON)** – fields from `CreatePreinscriptionDto`:

| Field               | Type   | Required | Description |
|---------------------|--------|----------|-------------|
| `first_name`        | string | Yes      | First name (max 255). |
| `last_name`         | string | Yes      | Last name (max 255). |
| `whatsapp_phone`    | string | Yes      | WhatsApp number (max 50). |
| `email`             | string | Yes      | Email address. |
| `nationality`       | string | Yes      | Nationality (e.g. `Moroccan`). |
| `city`              | string | Yes      | City (e.g. `Casablanca`). |
| `current_formation` | string | Yes      | Current diploma/formation (free text). |
| `desired_formation` | string | Yes      | Desired formation choice (free text – the frontend can enforce a predefined list). |
| `how_known`         | string | No       | How they knew the school (free text – the frontend can enforce a predefined list). |

> **Note**: `company_id` must **not** be sent from the public form. The backend sets it from `publicToken`.

### Suggested values for `desired_formation`

The **Desired formation** field is stored as free text in the backend, but the frontend **should** present and send one of these labels (radio/checkboxes or dropdown) to keep data consistent:

- Classes Prépas Économiques : ECT - ECG
- Classes Prépas Scientifiques : MPSI - MP
- Classes Préparatoires Intégrées
- Licence professionnelle Sciences de Gestion
- Licence professionnelle Droit des Affaires
- Licence professionnelle E-Business & Marketing
- Licence professionnelle Finance, Banque et Assurance
- Licence professionnelle Transport et Logistique
- Master Comptabilité, Contrôle & Audit (CCA)
- Master Ingénierie Financière
- Master Droit et Finance de l'Entreprise
- Master Marketing Digital & Stratégies Numériques
- Licence professionnelle Génie Informatique (Génie des Systèmes & Réseaux Informatique)
- Licence professionnelle Génie Informatique (Génie Logiciel)
- Licence professionnelle Génie Civil
- Licence professionnelle Génie Industriel
- Cycle d'Ingénieur Génie Informatique (Sciences de Données & Développement Informatique)
- Cycle d'Ingénieur Génie Informatique (Systèmes, Réseaux, sécurité & Cloud Infrastructure)
- Cycle d'Ingénieur Génie Civil
- Cycle d'Ingénieur Génie Industriel

The frontend should send one of these labels as `desired_formation` for consistency, but the backend will now accept any string (it no longer validates against this list).

### Suggested values for `how_known`

The “Comment avez-vous connu Estem ? / How did you hear about us?” field (`how_known`) is optional. The backend stores it as free text, but the frontend **should** present these options:

- Réseaux Sociaux
- Site Web
- Visite de l'ESTEM en Classe
- Professeur
- Connaissance
- Étudiants ESTEM
- Forum
- Conseillers d’orientation
- Cadre Professionnel
- Recherche sur Internet
- Publicité sur Internet
- Affichage
- Grâce à mon établissement actuel
- Autre :

The frontend should send one of these labels as `how_known` for consistency, but the backend will now accept any string (it no longer validates against this list).

#### Example request body

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "whatsapp_phone": "+212612345678",
  "email": "john.doe@example.com",
  "nationality": "Moroccan",
  "city": "Casablanca",
  "current_formation": "Licence en Informatique",
  "desired_formation": "Licence professionnelle Génie Informatique (Génie Logiciel)",
  "how_known": "Réseaux sociaux"
}
```

- **Response**: `201` – created pre‑inscription (with `id`, timestamps, etc.).

Frontend usage:

1. Build the form with the fields above.
2. On submit, POST to `/api/preinscriptions/public/{publicToken}`.
3. Show a success message on `201`, or display backend errors (validation, missing token, etc.).

---

## 3. Public: check if the student is already pre‑registered

If the student already filled the pre‑inscription form earlier, you can **pre‑fill** the registration form using their saved data.

### `GET /api/preinscriptions/public/:publicToken?email=...` (public)

- **Params (path)**:
  - `publicToken` – company public token.
- **Query**:
  - `email` (required) – email used during pre‑inscription.
- **Auth**: none.

Behavior:

- If a pre‑inscription exists for this `company` (via `publicToken`) and `email`, returns the full pre‑inscription.\n- If none is found, returns `404` – frontend can then show “No pre‑registration found” and present an empty form.

Example call:

```http
GET /api/preinscriptions/public/abcd1234efgh5678?email=john.doe@example.com
```

Example success response (simplified):

```json
{
  "id": 5,
  "first_name": "John",
  "last_name": "Doe",
  "whatsapp_phone": "+212612345678",
  "email": "john.doe@example.com",
  "nationality": "Moroccan",
  "city": "Casablanca",
  "current_formation": "Licence en Informatique",
  "desired_formation": "Master en Data Science",
  "how_known": "Réseaux sociaux",
  "company_id": 1,
  "created_at": "2026-03-04T10:00:00.000Z",
  "updated_at": "2026-03-04T10:00:00.000Z"
}
```

Frontend can then map these fields directly into the registration form.

---

## 4. Internal/admin CRUD for pre‑inscriptions

These endpoints are for authenticated back‑office usage (listing and managing pre‑inscriptions). They are protected by JWT.

Base URL: **`/api/preinscriptions`**

### `GET /api/preinscriptions` (admin, JWT)

Lists pre‑inscriptions **for the authenticated user’s company** with pagination and search.

Query parameters:

| Param   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `page`  | number | No       | Page number (default `1`). |
| `limit` | number | No       | Items per page (default `10`, max `100`). |
| `search` | string | No      | Free text search on `first_name`, `last_name`, `email`, `city`, `desired_formation`. |

Response:

```json
{
  "data": [ /* array of pre-inscriptions for this company */ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

### Other admin endpoints

- **`GET /api/preinscriptions/:id`** – get one pre‑inscription (only if it belongs to the same company).
- **`PATCH /api/preinscriptions/:id`** – update (company‑scoped).
- **`DELETE /api/preinscriptions/:id`** – delete (company‑scoped).
- **`POST /api/preinscriptions/:id/sync-to-student`** – create a `Student` + `User` from this pre‑inscription (same as adding a new student, single record).
- **`POST /api/preinscriptions/sync-to-students`** – batch sync multiple pre‑inscriptions to students in one call.

Batch sync request body:

```json
{
  "ids": [1, 2, 3]
}
```

Batch sync response (example):

```json
[
  { "id": 1, "status": "created", "student": { /* created student */ } },
  { "id": 2, "status": "skipped_existing", "message": "A student with email X already exists" },
  { "id": 3, "status": "error", "message": "Pre-inscription does not belong to your company" }
]
```

Use this to multi‑select pre‑inscriptions in the UI and sync them all at once while still seeing which ones were skipped because the student already exists.

The public site should normally only use the **public** endpoints described above.

---

## 5. Typical frontend flow (public site)

1. **Landing on the page**
   - URL: `/preinscription/:publicToken`.
   - Call `GET /api/company/public/:publicToken` to load company name/logo/colors.

2. **If the student might already be pre‑registered**
   - Ask for email (or use email from a previous step).\n   - Call `GET /api/preinscriptions/public/:publicToken?email={email}`.\n   - If found → pre‑fill the pre‑inscription (or full registration) form with returned fields.\n   - If not found → show an empty form.

3. **Submit / update pre‑inscription**
   - POST the form to `POST /api/preinscriptions/public/:publicToken`.\n   - Show confirmation (“Your pre‑registration has been recorded”).

4. **Later synchronization with student/user**
   - In the back‑office, staff can create the real `Student`/`User` record using this data.\n   - Or the registration flow can reuse the pre‑inscription data to build the `POST /api/students` payload if the student doesn’t exist yet.

