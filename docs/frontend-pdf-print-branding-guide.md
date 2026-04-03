# Frontend guide: branded PDFs & print (reports, notes, presence)

This app generates **report**, **session notes**, and **presence** PDFs **in the browser** (or via print). They must follow the same **company branding** as the backend’s `Company` entity and stay consistent with **Settings → PDF layout** (`logo`, header/footer lines, colors, letterhead flag).

**API base path:** `/api`  
**Auth:** `Authorization: Bearer <JWT>` for `GET /api/company/:id` (use the logged-in user’s `company_id`).

---

## 1. Why PDFs looked “unbranded”

Server-side `PdfLayoutService` is **not** used for these three flows. The UI must:

1. **Load company branding** (or reuse it from global app state / React Query cache).
2. **Apply it** to the print/PDF template (CSS, `@react-pdf/renderer`, `jspdf`, `html2canvas`, etc.).

If the template is hard-coded without reading `company`, you get plain headers and no logo.

---

## 2. Load company data for PDFs

### Endpoint (authenticated)

`GET /api/company/:id`

Use `:id` = **`user.company_id`** from the JWT payload (same company the user belongs to).

### Response shape (relevant fields)

These map to `src/company/entities/company.entity.ts`. Nest/TypeORM typically serializes **camelCase** in JSON:

| Field | Type | Use in PDF / print |
|--------|------|---------------------|
| `name` | string | Main title in header (e.g. school name). |
| `logo` | string \| null | Path like `/uploads/{companyId}/company/....png` — **not** a full URL. |
| `primaryColor` | string \| null | Hex `#RRGGBB` — accent (headers, rules, highlights). |
| `secondaryColor` | string \| null | Optional second accent. |
| `tertiaryColor` | string \| null | Optional third accent. |
| `entete_1`, `entete_2`, `entete_3` | string \| null | Up to **three** header lines (subtitle, address, slogan…). |
| `pied_1`, `pied_2`, `pied_3` | string \| null | Up to **three** footer lines. |
| `logo_left` | boolean | If `true` **and** `logo` is set → show logo on the **left** of the header. |
| `logo_right` | boolean | If `true` **and** `logo` is set → show logo on the **right** (same file, second placement). |
| `papier_entete` | boolean | If `true` → **pre-printed letterhead**: do **not** repeat embedded header/footer block in the PDF (see §4). |

**Logo URL for `<img>` / canvas / react-pdf `Image src`:**

```text
`${API_ORIGIN}${company.logo}`
```

Example: API at `https://api.example.com`, logo `/uploads/1/company/logo.png` →  
`https://api.example.com/uploads/1/company/logo.png`  
(Align with how your SPA already loads images; if you use a proxy, use that base instead.)

### Caching

- Fetch once per session or when entering “print/PDF” flows; keep in context (React Context, Pinia, Zustand, etc.) so **report**, **notes**, and **presence** all read the **same** object.

---

## 3. TypeScript: branding helper

Use a single module so all three PDF templates stay aligned:

```typescript
export interface CompanyPdfBranding {
  name: string;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor?: string | null;
  tertiaryColor?: string | null;
  entete_1?: string | null;
  entete_2?: string | null;
  entete_3?: string | null;
  pied_1?: string | null;
  pied_2?: string | null;
  pied_3?: string | null;
  logo_left: boolean;
  logo_right: boolean;
  papier_entete: boolean;
}

const DEFAULT_ACCENT = '#1e3a5f'; // navy fallback if primaryColor missing (performance report style)
const DEFAULT_MUTED = '#6b7280';

export function resolveLogoUrl(logoPath: string | null | undefined, apiOrigin: string): string | null {
  if (!logoPath?.trim()) return null;
  const path = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
  return `${apiOrigin.replace(/\/$/, '')}${path}`;
}

export function resolveAccent(company: Pick<CompanyPdfBranding, 'primaryColor'>): string {
  const c = company.primaryColor?.trim();
  if (c && /^#[0-9A-Fa-f]{6}$/.test(c)) return c;
  return DEFAULT_ACCENT;
}

export function headerLines(company: CompanyPdfBranding): string[] {
  return [company.entete_1, company.entete_2, company.entete_3].filter(
    (x): x is string => typeof x === 'string' && x.trim() !== '',
  );
}

export function footerLines(company: CompanyPdfBranding): string[] {
  return [company.pied_1, company.pied_2, company.pied_3].filter(
    (x): x is string => typeof x === 'string' && x.trim() !== '',
  );
}
```

---

## 4. Letterhead: `papier_entete`

| `papier_entete` | What to do in the **browser** PDF |
|-----------------|-----------------------------------|
| `false` (default) | Render full **digital** header: optional logo(s), `name`, `entete_*`, and footer `pied_*` + page numbers. |
| `true` | User prints on **pre-printed** paper. **Omit** the repeated block: `name`, all `entete_*`, all `pied_*`, and **both** logo placements in the template. Keep only document-specific content (title, tables, signatures). Optionally add **extra top margin** so content clears the physical letterhead. |

This mirrors backend `PdfLayoutService` behavior for server-generated PDFs.

---

## 5. Shared layout components (all three PDF types)

Implement **once**, reuse everywhere:

### 5.1 Header row

- **Left column (flex):**
  - If `!papier_entete && logo_left && logoUrl` → `<img>` fixed height (e.g. 48–64px).
  - Stack: `name` (bold, `resolveAccent(company)` or navy), then each `entete_*` line (smaller, `DEFAULT_MUTED`).
- **Right column:**
  - If `!papier_entete && logo_right && logoUrl` → same image.
  - Session/report metadata (year, term, generated date, etc.) — **document-specific**.

### 5.2 Accent rule

- Full-width `border-bottom: 2px solid {accent}` or `<hr>` with that color — matches the “branded strip” idea.

### 5.3 Footer

- If `!papier_entete`: center `pied_1` … `pied_3`, small gray text; then “Page x / y” if your engine supports it (`@react-pdf` `render` prop, or CSS `counter(page)` in print).

### 5.4 Colors for “performance report” style (optional)

If you want the **academic performance** look (navy + light blue panels):

- **Navy:** `resolveAccent(company)` or `#1e3a5f`.
- **Panel light blue:** `#EBF2FF` (table header, stat cards).
- **Panel gray:** `#F3F4F6` (student info strip).
- **Borders:** `#E5E7EB`.

Use **CSS variables** set from `company` when the print root mounts:

```css
.pdf-root {
  --pdf-accent: var(--company-accent, #1e3a5f);
  --pdf-panel-blue: #ebf2ff;
  --pdf-panel-gray: #f3f4f6;
  --pdf-muted: #6b7280;
}
```

---

## 6. Document-specific content (what you already have)

Wire **only the body** per screen; **always wrap** with the shared header/footer from §5.

| Document | Body highlights |
|----------|-----------------|
| **Academic performance report** | Student block (two columns), three stat boxes, course table (Course / Note / Coefficient / Remarks), attendance summary, two note boxes (class council / principal). |
| **Presence sheet** | Metadata list (date, class, teacher, subject, time, session, room), “Presence” two columns Absent / Present, signature lines. |
| **Session notes (graded)** | Same metadata block, “Notes” heading, Absent vs Present (graded) with scores. |

Labels like `DATE:`, `CLASS / GROUP:` can use `color: var(--pdf-muted); text-transform: uppercase; font-size: 0.75rem;` and values **bold** — matches your current screenshots but now under a branded shell.

---

## 7. Implementation stacks (pick one; principles are the same)

### A. HTML + `window.print()` / “Save as PDF”

1. Render a hidden or dedicated route `PrintLayout` with the shared header/footer.
2. `@media print { }` — hide nav, sidebar, buttons; set `@page { margin: 12mm; }`.
3. Inject CSS variables from `company` on mount.

### B. `@react-pdf/renderer`

1. `View` / `Text` / `Image` components for `BrandedHeader`, `BrandedFooter`.
2. `Image src={logoUrl}` only when flags allow; `papier_entete` skips them.
3. Use `StyleSheet.create` with colors from `resolveAccent(company)`.

### C. `jspdf` + `html2canvas`

1. Capture a DOM node that already includes the branded layout, or draw header with `doc.setDrawColor` / images from loaded `logoUrl`.

---

## 8. Checklist before shipping

- [ ] `GET /api/company/:id` called with JWT `company_id` (or equivalent cached profile).
- [ ] Logo URL = API origin + `company.logo`.
- [ ] `logo_left` / `logo_right` respected; both can be true (same image twice).
- [ ] Only **non-empty** `entete_*` / `pied_*` rendered (0–3 lines each).
- [ ] `papier_entete === true` → no logo, no name, no entête/pied in the template; optional top margin.
- [ ] `primaryColor` drives accent when valid `#RRGGBB`; sensible navy fallback for reports.
- [ ] **Report**, **notes**, and **presence** all import the **same** header/footer component or PDF primitives.

---

## 9. Public / unauthenticated contexts

If a PDF is ever generated **without** JWT (rare), you cannot use `GET /api/company/:id` unless you add a public rule. For **pre-inscription**-style pages, the backend exposes:

`GET /api/company/public/:publicToken`

Same entity fields; use `publicToken` from URL when no user session exists.

---

## 10. Backend reference

- Entity & field meanings: `src/company/entities/company.entity.ts` (comment block at top).
- Update payload field names: `PATCH /api/company/:id` — see `validFields` in `company.controller.ts` (`entete_*`, `pied_*`, `logo_left`, `logo_right`, `papier_entete`, colors).

Server-side PDF generation (optional future): `PdfLayoutService` in `src/pdf/` — **not** used until you add download endpoints and switch the UI to them.
