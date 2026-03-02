# Login Response Structure - Complete Data Sent to Frontend

## 🔑 Login Endpoint

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 📦 Complete Response Structure

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImNvbXBhbnlJZCI6MSwiaWF0IjoxNzA1MTIzNDU2LCJleHAiOjE3MDUxMjcwNTZ9.xyz...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "company_id": 1,
    "roles": ["admin", "finance"],
    "allowedPages": [
      "/dashboard",
      "/students",
      "/payments",
      "/reports",
      "/users",
      "/roles"
    ],
    "company": {
      "id": 1,
      "name": "My School",
      "email": "school@example.com"
    }
  }
}
```

---

## 📊 Field Descriptions

### Top Level

| Field | Type | Description |
|-------|------|-------------|
| `token` | `string` | JWT token for authenticated requests |
| `user` | `object` | Complete user information with roles and permissions |

### User Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `number` | User ID | `1` |
| `email` | `string` | User email address | `"admin@example.com"` |
| `username` | `string` | Username for login | `"admin"` |
| `company_id` | `number` | Company ID the user belongs to | `1` |
| `roles` | `string[]` | **Array of role codes** (e.g., "admin", "finance") | `["admin", "finance"]` |
| `allowedPages` | `string[]` | **Array of allowed page routes** user can access | `["/dashboard", "/students"]` |
| `company` | `object \| null` | Company information (if available) | See below |

### Company Object (if available)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Company ID |
| `name` | `string` | Company name |
| `email` | `string` | Company email |

---

## 🔍 Real-World Examples

### Example 1: Admin User Login

**Request:**
```json
{
  "email": "admin@school.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@school.com",
    "username": "admin",
    "company_id": 1,
    "roles": ["admin"],
    "allowedPages": [
      "/dashboard",
      "/students",
      "/teachers",
      "/payments",
      "/reports",
      "/users",
      "/roles",
      "/settings"
    ],
    "company": {
      "id": 1,
      "name": "My School",
      "email": "school@example.com"
    }
  }
}
```

**Note:** Admin role typically gets access to ALL pages in their company.

---

### Example 2: Finance User Login

**Request:**
```json
{
  "email": "finance@school.com",
  "password": "finance123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "email": "finance@school.com",
    "username": "finance_user",
    "company_id": 1,
    "roles": ["finance"],
    "allowedPages": [
      "/dashboard",
      "/payments",
      "/reports"
    ],
    "company": {
      "id": 1,
      "name": "My School",
      "email": "school@example.com"
    }
  }
}
```

**Note:** Finance user only has access to pages assigned to the "finance" role.

---

### Example 3: User with Multiple Roles

**Request:**
```json
{
  "email": "user@school.com",
  "password": "user123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 10,
    "email": "user@school.com",
    "username": "user",
    "company_id": 1,
    "roles": ["finance", "student"],
    "allowedPages": [
      "/dashboard",
      "/payments",
      "/reports",
      "/students",
      "/my-courses"
    ],
    "company": {
      "id": 1,
      "name": "My School",
      "email": "school@example.com"
    }
  }
}
```

**Note:** User has multiple roles, so `allowedPages` is the union of all pages from both roles.

---

### Example 4: User with No Roles

**Request:**
```json
{
  "email": "newuser@school.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 15,
    "email": "newuser@school.com",
    "username": "newuser",
    "company_id": 1,
    "roles": [],
    "allowedPages": [],
    "company": {
      "id": 1,
      "name": "My School",
      "email": "school@example.com"
    }
  }
}
```

**Note:** User has no roles, so `roles` and `allowedPages` are empty arrays. Admin must assign roles.

---

## 💻 Frontend Implementation

### Store Login Response

```typescript
async function handleLogin(email: string, password: string) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  
  // Store token
  localStorage.setItem('token', data.token);
  
  // Store user data
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // Store roles (array of strings)
  localStorage.setItem('roles', JSON.stringify(data.user.roles));
  
  // Store allowed pages (array of routes)
  localStorage.setItem('allowedPages', JSON.stringify(data.user.allowedPages));
  
  // Store company ID
  localStorage.setItem('company_id', data.user.company_id.toString());
  
  return data;
}
```

---

### Access User Data

```typescript
// Get token
const token = localStorage.getItem('token');

// Get user object
const user = JSON.parse(localStorage.getItem('user') || '{}');
// user = { id: 1, email: "...", username: "...", roles: [...], allowedPages: [...] }

// Get roles array
const roles = JSON.parse(localStorage.getItem('roles') || '[]');
// roles = ["admin", "finance"]

// Get allowed pages array
const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
// allowedPages = ["/dashboard", "/students", "/payments"]

// Check if user is admin
const isAdmin = roles.includes('admin');

// Check if user can access a page
const canAccessPage = (route: string) => {
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  return allowedPages.includes(route);
};
```

---

## 🔐 JWT Token Payload

The JWT token contains:

```json
{
  "userId": 1,
  "companyId": 1,
  "iat": 1705123456,
  "exp": 1705127056
}
```

**Note:** Roles are NOT in the JWT token. Always check `user.roles` from login response or stored user data.

---

## ⚠️ Important Notes

1. **Roles are Array of Strings:**
   - `roles: ["admin", "finance"]` - Array of role codes
   - NOT role IDs, NOT role objects

2. **AllowedPages are Routes:**
   - `allowedPages: ["/dashboard", "/students"]` - Array of route paths
   - Use these for route protection and menu filtering

3. **Empty Arrays:**
   - If user has no roles: `roles: []`
   - If user has no page access: `allowedPages: []`
   - User cannot access any protected routes

4. **Admin Role:**
   - Users with `admin` role typically get access to ALL pages in their company
   - Check `roles.includes('admin')` to verify admin status

5. **Company Data:**
   - `company` may be `null` if company relation is not loaded
   - Always check if company exists before accessing properties

---

## 📝 TypeScript Types

```typescript
interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    username: string;
    company_id: number;
    roles: string[];  // Array of role codes
    allowedPages: string[];  // Array of route paths
    company: {
      id: number;
      name: string;
      email: string;
    } | null;
  };
}

// Usage
const loginResponse: LoginResponse = await handleLogin(email, password);
const { token, user } = loginResponse;
```

---

## 🎯 Frontend Usage Examples

### 1. Check if User is Admin

```typescript
const user = JSON.parse(localStorage.getItem('user') || '{}');
const isAdmin = user.roles?.includes('admin') || false;
```

### 2. Check if User Has Role

```typescript
const user = JSON.parse(localStorage.getItem('user') || '{}');
const hasFinanceRole = user.roles?.includes('finance') || false;
```

### 3. Check if User Can Access Route

```typescript
const user = JSON.parse(localStorage.getItem('user') || '{}');
const canAccess = user.allowedPages?.includes('/payments') || false;
```

### 4. Build Navigation Menu

```typescript
const user = JSON.parse(localStorage.getItem('user') || '{}');
const allowedPages = user.allowedPages || [];

const menuItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/students', label: 'Students' },
  { path: '/payments', label: 'Payments' },
  { path: '/reports', label: 'Reports' },
].filter(item => allowedPages.includes(item.path));
```

### 5. Route Guard

```typescript
function ProtectedRoute({ children, requiredRoute }: { children: JSX.Element, requiredRoute: string }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const allowedPages = user.allowedPages || [];
  
  if (!allowedPages.includes(requiredRoute)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}
```

---

## 🔄 Refresh Allowed Pages

If roles are updated, you may need to refresh allowed pages:

```typescript
// Option 1: Re-login
await handleLogin(email, password);

// Option 2: Call my-routes endpoint
async function refreshAllowedPages() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/pages/my-routes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { routes } = await response.json();
  
  // Update stored user data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  user.allowedPages = routes;
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('allowedPages', JSON.stringify(routes));
}
```

---

## ✅ Summary

**After login, frontend receives:**

1. ✅ **JWT Token** - For authenticated requests
2. ✅ **User ID, Email, Username, Company ID** - Basic user info
3. ✅ **Roles Array** - `["admin", "finance"]` - Role codes user has
4. ✅ **AllowedPages Array** - `["/dashboard", "/students"]` - Routes user can access
5. ✅ **Company Object** - Company information (if available)

**Frontend should:**
- Store token for API requests
- Store roles for UI visibility checks
- Store allowedPages for route protection and menu filtering
- Use this data for authorization throughout the app

---

**Related Documentation:**
- `docs/RBAC_FRONTEND_GUIDE.md` - Complete RBAC guide
- `docs/FRONTEND_IMPLEMENTATION_CHECKLIST.md` - Implementation checklist
