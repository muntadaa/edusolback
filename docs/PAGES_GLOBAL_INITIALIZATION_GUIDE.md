# Pages Global Initialization Guide

## 📋 Overview

**Important Change:** Pages are now **global** and shared across all companies. They are no longer tied to a specific `company_id`. This means:

- ✅ Pages are created **once** for the entire system
- ✅ All companies share the same set of pages
- ✅ Role-page assignments remain company-specific (handled via `role_pages` table)
- ✅ Frontend should initialize pages **once** on startup, not per company

## 🎯 Frontend Initialization Flow

When your frontend application starts, you should:

1. **Check if your routes exist** in the database
2. **Create missing pages** if they don't exist
3. **Continue with normal operation**

This ensures all required pages are available globally before users start using the system.

---

## 📡 API Endpoints

### 1. Check Existing Pages

**Endpoint:** `GET /api/pages`  
**Auth:** Required (Admin JWT Token)  
**Description:** Get all global pages (paginated)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Administrators",
      "route": "/administrators",
      "created_at": "2026-01-15T10:00:00.000Z",
      "updated_at": "2026-01-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Students",
      "route": "/students",
      "created_at": "2026-01-15T10:00:00.000Z",
      "updated_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by title or route

---

### 2. Create Pages from Routes

**Endpoint:** `POST /api/pages/create-from-routes`  
**Auth:** Required (Admin JWT Token)  
**Description:** Create multiple global pages from an array of routes. Automatically skips routes that already exist.

**Request Body:**
```json
{
  "routes": [
    {
      "route": "/administrators",
      "title": "Administrators"
    },
    {
      "route": "/students",
      "title": "Students"
    },
    {
      "route": "/teachers",
      "title": "Teachers"
    }
  ],
  "skipExisting": true
}
```

**Response:**
```json
{
  "created": 2,
  "skipped": 1,
  "pages": [
    {
      "id": 3,
      "title": "Teachers",
      "route": "/teachers",
      "created_at": "2026-01-15T10:00:00.000Z",
      "updated_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "errors": []
}
```

**Request Fields:**
- `routes` (required): Array of route objects
  - `route` (required): Route path (must start with `/`)
  - `title` (required): Display title for the page
- `skipExisting` (optional): If `true`, skip routes that already exist. If `false`, return error for duplicates. Default: `true`

**Response Fields:**
- `created`: Number of pages successfully created
- `skipped`: Number of routes that were skipped (already exist)
- `pages`: Array of newly created page objects
- `errors`: Array of error messages for any failures

---

## 💻 Frontend Implementation Examples

### React/TypeScript Example

```typescript
// types.ts
export interface Page {
  id: number;
  title: string;
  route: string;
  created_at: string;
  updated_at: string;
}

export interface RouteDefinition {
  route: string;
  title: string;
}

// pagesApi.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export async function getAllPages(token: string): Promise<Page[]> {
  const response = await axios.get(`${API_BASE_URL}/pages`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 1000 } // Get all pages
  });
  return response.data.data;
}

export async function createPagesFromRoutes(
  routes: RouteDefinition[],
  token: string,
  skipExisting: boolean = true
): Promise<{ created: number; skipped: number; pages: Page[]; errors: string[] }> {
  const response = await axios.post(
    `${API_BASE_URL}/pages/create-from-routes`,
    { routes, skipExisting },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// usePagesInitialization.ts (Custom Hook)
import { useEffect, useState } from 'react';
import { getAllPages, createPagesFromRoutes, RouteDefinition } from './pagesApi';

// Define all your application routes here
const APP_ROUTES: RouteDefinition[] = [
  { route: '/administrators', title: 'Administrators' },
  { route: '/students', title: 'Students' },
  { route: '/teachers', title: 'Teachers' },
  { route: '/courses', title: 'Courses' },
  { route: '/modules', title: 'Modules' },
  { route: '/classes', title: 'Classes' },
  { route: '/class-rooms', title: 'Class Rooms' },
  { route: '/class-students', title: 'Class Students' },
  { route: '/school-years', title: 'School Years' },
  { route: '/school-year-periods', title: 'School Year Periods' },
  { route: '/programs', title: 'Programs' },
  { route: '/levels', title: 'Levels' },
  { route: '/specializations', title: 'Specializations' },
  { route: '/planning', title: 'Planning' },
  { route: '/planning-session-types', title: 'Planning Session Types' },
  { route: '/student-presence', title: 'Student Presence' },
  { route: '/student-reports', title: 'Student Reports' },
  { route: '/student-report-details', title: 'Student Report Details' },
  { route: '/student-payments', title: 'Student Payments' },
  { route: '/level-pricings', title: 'Level Pricings' },
  { route: '/student-attestations', title: 'Student Attestations' },
  { route: '/attestations', title: 'Attestations' },
  { route: '/student-diplomes', title: 'Student Diplomes' },
  { route: '/student-contacts', title: 'Student Contacts' },
  { route: '/student-link-types', title: 'Student Link Types' },
  { route: '/student-notes', title: 'Student Notes' },
  { route: '/class-courses', title: 'Class Courses' },
  { route: '/users', title: 'Users' },
  { route: '/companies', title: 'Companies' },
  { route: '/settings', title: 'Settings' },
  { route: '/dashboard', title: 'Dashboard' },
];

export function usePagesInitialization(adminToken: string | null) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [initializationResult, setInitializationResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    async function initializePages() {
      if (!adminToken) {
        setIsInitializing(false);
        return;
      }

      try {
        console.log('🔍 Checking existing pages...');
        
        // Step 1: Get all existing pages
        const existingPages = await getAllPages(adminToken);
        const existingRoutes = new Set(existingPages.map(page => page.route));

        // Step 2: Find missing routes
        const missingRoutes = APP_ROUTES.filter(
          route => !existingRoutes.has(route.route)
        );

        if (missingRoutes.length === 0) {
          console.log('✅ All pages already exist in database');
          setInitializationResult({
            created: 0,
            skipped: APP_ROUTES.length,
            errors: [],
          });
          setIsInitializing(false);
          return;
        }

        console.log(`📝 Creating ${missingRoutes.length} missing pages...`);

        // Step 3: Create missing pages
        const result = await createPagesFromRoutes(missingRoutes, adminToken, true);
        
        console.log(`✅ Pages initialization complete:`, {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors.length > 0 ? result.errors : 'none',
        });

        setInitializationResult({
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        });
      } catch (error: any) {
        console.error('❌ Error initializing pages:', error);
        setInitializationError(
          error.response?.data?.message || error.message || 'Failed to initialize pages'
        );
      } finally {
        setIsInitializing(false);
      }
    }

    initializePages();
  }, [adminToken]);

  return {
    isInitializing,
    initializationError,
    initializationResult,
  };
}

// App.tsx (Usage Example)
import { usePagesInitialization } from './hooks/usePagesInitialization';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { adminToken } = useAuth(); // Your auth context
  const { isInitializing, initializationError, initializationResult } = 
    usePagesInitialization(adminToken);

  if (isInitializing) {
    return <div>Initializing pages...</div>;
  }

  if (initializationError) {
    return <div>Error: {initializationError}</div>;
  }

  return (
    <div>
      {initializationResult && (
        <div>
          <p>Pages created: {initializationResult.created}</p>
          <p>Pages skipped: {initializationResult.skipped}</p>
          {initializationResult.errors.length > 0 && (
            <div>
              <p>Errors:</p>
              <ul>
                {initializationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {/* Your app content */}
    </div>
  );
}
```

---

### Vue.js Example

```typescript
// composables/usePagesInitialization.ts
import { ref, onMounted } from 'vue';
import { getAllPages, createPagesFromRoutes, RouteDefinition } from '@/api/pagesApi';

const APP_ROUTES: RouteDefinition[] = [
  { route: '/administrators', title: 'Administrators' },
  { route: '/students', title: 'Students' },
  // ... add all your routes
];

export function usePagesInitialization(adminToken: string | null) {
  const isInitializing = ref(true);
  const initializationError = ref<string | null>(null);
  const initializationResult = ref<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  async function initializePages() {
    if (!adminToken) {
      isInitializing.value = false;
      return;
    }

    try {
      const existingPages = await getAllPages(adminToken);
      const existingRoutes = new Set(existingPages.map(page => page.route));
      const missingRoutes = APP_ROUTES.filter(
        route => !existingRoutes.has(route.route)
      );

      if (missingRoutes.length === 0) {
        initializationResult.value = {
          created: 0,
          skipped: APP_ROUTES.length,
          errors: [],
        };
        isInitializing.value = false;
        return;
      }

      const result = await createPagesFromRoutes(missingRoutes, adminToken, true);
      initializationResult.value = {
        created: result.created,
        skipped: result.skipped,
        errors: result.errors,
      };
    } catch (error: any) {
      initializationError.value = error.response?.data?.message || error.message;
    } finally {
      isInitializing.value = false;
    }
  }

  onMounted(() => {
    initializePages();
  });

  return {
    isInitializing,
    initializationError,
    initializationResult,
    initializePages,
  };
}
```

---

## 🔑 Authentication Notes

**Important:** Both endpoints require **Admin JWT authentication**. You'll need:

1. An admin user account in the system
2. Login as admin to get the JWT token
3. Use that token for the initialization API calls

**Recommendation:** Initialize pages during your application's bootstrap phase, right after admin login or during a one-time setup process.

---

## ✅ Best Practices

1. **Centralize Route Definitions**: Keep all your route definitions in a single file/constant array
2. **Run Once**: Initialize pages once on application startup, not on every user login
3. **Handle Errors Gracefully**: Log errors but don't block the application from starting
4. **Idempotent Operations**: The `create-from-routes` endpoint is idempotent - you can call it multiple times safely
5. **Monitor Results**: Log the initialization results for debugging

---

## 🚨 Important Notes

### ⚠️ Pages are Global

- Pages are **NOT** company-specific anymore
- Creating a page makes it available to **all companies**
- Only **one** page can exist per route globally
- Role-page assignments (who can access what) remain company-specific

### ✅ What This Means for Your Frontend

- ✅ Initialize pages **once** when the app starts (not per company)
- ✅ Use the same route definitions across all companies
- ✅ Don't try to create duplicate pages - they'll be skipped automatically
- ✅ Check routes on startup and create missing ones

### 🔄 Migration Impact

If you have existing pages in the database:
- Duplicate pages (same route for different companies) have been merged
- Only one page per route now exists globally
- Role-page assignments remain intact per company

---

## 📝 Summary

**Frontend Initialization Checklist:**

- [ ] Define all your application routes in a constant array
- [ ] Create API functions to get all pages and create pages from routes
- [ ] Implement initialization logic that:
  1. Gets all existing pages from the database
  2. Compares with your route definitions
  3. Creates missing pages using `POST /api/pages/create-from-routes`
- [ ] Run initialization once on app startup (after admin authentication)
- [ ] Handle errors gracefully without blocking app startup
- [ ] Log initialization results for monitoring

**API Endpoints Summary:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/pages` | GET | Admin | Get all global pages |
| `/api/pages/create-from-routes` | POST | Admin | Create multiple pages from routes |

---

## 🆘 Troubleshooting

### Error: "CAPTCHA token is required"
- Make sure you're using an Admin JWT token
- Verify the token is still valid

### Error: "Route already exists"
- This is normal if pages were already created
- Use `skipExisting: true` to automatically skip existing routes

### Pages not appearing for users
- Pages are global, but role-page assignments are company-specific
- Make sure roles are assigned to pages for each company via `/api/pages/assign`

---

**Questions?** Contact the backend team or refer to the main API documentation.
