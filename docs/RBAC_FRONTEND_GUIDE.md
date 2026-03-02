# RBAC System - Frontend Integration Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication & Authorization Flow](#authentication--authorization-flow)
3. [API Endpoints](#api-endpoints)
4. [Frontend Implementation](#frontend-implementation)
5. [Examples](#examples)

---

## 🎯 Overview

The system uses a **Role-Based Access Control (RBAC)** system where:
- **Users** have **one or multiple roles**
- **Roles** have **assigned pages** (routes)
- **Pages** define which routes a role can access
- Only **administrators** can manage roles and role-page assignments

### Key Concepts

- **System Roles**: Pre-defined roles (admin, finance, student, teacher, etc.) that cannot be deleted
- **Custom Roles**: Company-specific roles that administrators can create
- **Pages**: Application routes that can be assigned to roles
- **Allowed Pages**: The list of routes a user can access based on their roles

---

## 🔐 Authentication & Authorization Flow

### 0. User Registration vs User Creation

**Important Distinction:**

#### Public Registration (`/auth/register`)
- **No authentication required** (public endpoint)
- **No role assignment** - registration doesn't accept `role_ids`
- **First user for a company** → Automatically gets `admin` role
- **Subsequent users** → Created **without roles** (admin must assign roles later)
- Use this for: Public user sign-up, first admin creation

#### Admin User Creation (`/users` endpoint)
- **Requires admin authentication** (JWT token + admin role)
- **Accepts `role_ids`** - can assign roles during creation
- Use this for: Admin creating users with specific roles

**Example Flow:**
```typescript
// 1. First user registers (becomes admin automatically)
POST /auth/register
{
  "email": "admin@company1.com",
  "password": "password123",
  "username": "admin",
  "company_id": 1
}
// → User created with admin role automatically

// 2. Admin creates other users with roles
POST /users
Authorization: Bearer <admin_token>
{
  "email": "finance@company1.com",
  "password": "password123",
  "username": "finance_user",
  "role_ids": [2]  // finance role
}
// → User created with finance role
```

---

### 1. Login Response

When a user logs in, the API returns their roles and allowed pages:

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john.doe",
    "company_id": 1,
    "roles": ["admin", "finance"],
    "allowedPages": [
      "/dashboard",
      "/students",
      "/payments",
      "/reports"
    ],
    "company": {
      "id": 1,
      "name": "School Name",
      "email": "school@example.com"
    }
  }
}
```

### 2. Profile Endpoint

Get current user information with roles:

**Endpoint:** `GET /profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "This is a protected route",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john.doe",
    "roles": ["admin", "finance"],
    "company_id": 1,
    "company": {
      "id": 1,
      "name": "School Name",
      "email": "school@example.com"
    }
  }
}
```

**Note:** For allowed pages, use the `allowedPages` from the login response or call `GET /pages/my-routes`.

### 3. Get Allowed Routes

Get current user's allowed routes:

**Endpoint:** `GET /pages/my-routes`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "routes": [
    "/dashboard",
    "/students",
    "/payments"
  ]
}
```

---

## 🔑 API Endpoints

### Roles Management (Admin Only)

#### 1. Get All Roles

**Endpoint:** `GET /roles`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by code or label
- `is_system` (optional): Filter by system roles (true/false)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "code": "admin",
      "label": "Administrator",
      "company_id": null,
      "is_system": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "code": "finance",
      "label": "Finance",
      "company_id": null,
      "is_system": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 10,
      "code": "custom_role",
      "label": "Custom Role",
      "company_id": 1,
      "is_system": false,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

#### 2. Create New Role

**Endpoint:** `POST /roles`

**Request:**
```json
{
  "code": "custom_role",
  "label": "Custom Role Name",
  "is_system": false
}
```

**Note:** `is_system` must be `false` when creating via API (only system roles can have `is_system: true`).

**Response:**
```json
{
  "id": 10,
  "code": "custom_role",
  "label": "Custom Role Name",
  "company_id": 1,
  "is_system": false,
  "created_at": "2024-01-15T00:00:00.000Z",
  "updated_at": "2024-01-15T00:00:00.000Z"
}
```

#### 3. Get Role by ID

**Endpoint:** `GET /roles/:id`

**Response:**
```json
{
  "id": 1,
  "code": "admin",
  "label": "Administrator",
  "company_id": null,
  "is_system": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### 4. Update Role

**Endpoint:** `PATCH /roles/:id`

**Request:**
```json
{
  "label": "Updated Role Name"
}
```

**Note:** Cannot change `code` or `is_system` for system roles.

#### 5. Delete Role

**Endpoint:** `DELETE /roles/:id`

**Note:** Cannot delete system roles (`is_system: true`).

---

### Role-Page Assignments (Admin Only)

#### 1. Get Pages for a Role

**Endpoint:** `GET /roles/:id/pages`

**Response:**
```json
[
  {
    "id": 1,
    "title": "Dashboard",
    "route": "/dashboard",
    "company_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Payments",
    "route": "/payments",
    "company_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 2. Assign Page to Role

**Endpoint:** `POST /roles/:id/pages`

**Request:**
```json
{
  "page_id": 5
}
```

**Response:**
```json
{
  "role_id": 2,
  "page_id": 5,
  "company_id": 1,
  "created_at": "2024-01-15T00:00:00.000Z"
}
```

#### 3. Remove Page from Role

**Endpoint:** `DELETE /roles/:id/pages/:pageId`

**Response:** `204 No Content`

#### 4. Alternative: Assign via Pages Endpoint

**Endpoint:** `POST /pages/assign`

**Request:**
```json
{
  "role_id": 2,
  "page_id": 5
}
```

#### 5. Get Roles for a Page

**Endpoint:** `GET /pages/page/:pageId/roles`

**Response:**
```json
[
  {
    "id": 1,
    "code": "admin",
    "label": "Administrator",
    "company_id": null,
    "is_system": true
  },
  {
    "id": 2,
    "code": "finance",
    "label": "Finance",
    "company_id": null,
    "is_system": true
  }
]
```

---

### User-Role Assignments (Admin Only)

#### 1. Get User Roles

**Endpoint:** `GET /users/:userId/roles`

**Response:**
```json
[
  {
    "id": 1,
    "code": "admin",
    "label": "Administrator",
    "company_id": null,
    "is_system": true
  },
  {
    "id": 2,
    "code": "finance",
    "label": "Finance",
    "company_id": null,
    "is_system": true
  }
]
```

#### 2. Assign Role to User

**Endpoint:** `POST /users/:userId/roles`

**Request:**
```json
{
  "role_id": 2
}
```

**Response:**
```json
{
  "user_id": 5,
  "role_id": 2,
  "company_id": 1
}
```

#### 3. Remove Role from User

**Endpoint:** `DELETE /users/:userId/roles/:roleId`

**Response:** `204 No Content`

---

## 💻 Frontend Implementation

### 0. Registration vs User Creation

**When to use which endpoint:**

```typescript
// ✅ Use /auth/register for:
// - Public user registration
// - First admin creation (becomes admin automatically)
// - Self-registration flows

async function registerUser(email: string, password: string, username: string, companyId: number) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      username,
      company_id: companyId,
      // Note: NO role_ids field - not accepted in registration
    }),
  });
  return response.json();
}

// ✅ Use /users endpoint (admin only) for:
// - Creating users with specific roles
// - Admin-controlled user management
// - Bulk user creation

async function createUserWithRoles(
  email: string, 
  password: string, 
  username: string, 
  roleIds: number[],
  token: string
) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Admin token required
    },
    body: JSON.stringify({
      email,
      password,
      username,
      role_ids: roleIds, // Can assign roles here
    }),
  });
  return response.json();
}
```

### 1. Store User Data After Login

```typescript
// After successful login
interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    username: string;
    roles: string[];
    allowedPages: string[];
    company_id: number;
  };
}

// Store in your state management (Redux, Zustand, Context, etc.)
const userData = {
  token: response.token,
  user: response.user,
  roles: response.user.roles,
  allowedPages: response.user.allowedPages
};

// Save to localStorage/sessionStorage
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.user));
localStorage.setItem('allowedPages', JSON.stringify(response.user.allowedPages));
```

### 2. Route Protection

```typescript
// React Router example
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, requiredPage }) {
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  const location = useLocation();

  // Check if user has access to this route
  if (!allowedPages.includes(location.pathname)) {
    // Redirect to unauthorized page or dashboard
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Usage
<Route 
  path="/payments" 
  element={
    <ProtectedRoute requiredPage="/payments">
      <PaymentsPage />
    </ProtectedRoute>
  } 
/>
```

### 3. Dynamic Menu Rendering

```typescript
// Only show menu items for allowed pages
const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/students', label: 'Students', icon: StudentsIcon },
  { path: '/payments', label: 'Payments', icon: PaymentsIcon },
  { path: '/reports', label: 'Reports', icon: ReportsIcon },
];

function NavigationMenu() {
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  
  const visibleMenuItems = menuItems.filter(item => 
    allowedPages.includes(item.path)
  );

  return (
    <nav>
      {visibleMenuItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

### 4. Role-Based Component Rendering

```typescript
// Check if user has specific role
function hasRole(roleCode: string): boolean {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.roles?.includes(roleCode) || false;
}

// Check if user has access to page
function hasPageAccess(pagePath: string): boolean {
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  return allowedPages.includes(pagePath);
}

// Usage in components
function AdminPanel() {
  if (!hasRole('admin')) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <div>Admin Panel Content</div>;
}

function PaymentsButton() {
  if (!hasPageAccess('/payments')) {
    return null; // Don't render the button
  }
  
  return <button>View Payments</button>;
}
```

### 5. Refresh Allowed Pages

```typescript
// Call this when roles are updated
async function refreshUserPermissions() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/pages/my-routes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    localStorage.setItem('allowedPages', JSON.stringify(data.routes));
  } catch (error) {
    console.error('Failed to refresh permissions:', error);
  }
}
```

---

## 📝 Examples

### Example 0: User Registration (Public)

```typescript
// Public registration - no authentication needed
async function handleRegistration(formData: {
  email: string;
  password: string;
  username: string;
  company_id: number;
}) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        company_id: formData.company_id,
        // No role_ids - registration doesn't accept roles
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    
    // First user for company automatically gets admin role
    // Subsequent users have no roles (admin must assign later)
    
    return {
      success: true,
      message: data.message,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

// Usage in registration form
function RegistrationForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    company_id: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleRegistration(formData);
    
    if (result.success) {
      // Redirect to login or auto-login
      alert('Registration successful! Please login.');
      navigate('/login');
    } else {
      alert(`Registration failed: ${result.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      <input
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        placeholder="Username"
        required
      />
      <button type="submit">Register</button>
    </form>
  );
}
```

### Example 1: Admin Creates Custom Role and Assigns Pages

```typescript
// Step 1: Create a new role
const createRole = async () => {
  const response = await fetch('/api/roles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'accountant',
      label: 'Accountant',
      is_system: false
    })
  });
  
  const role = await response.json();
  return role.id; // e.g., 10
};

// Step 2: Get available pages
const getPages = async () => {
  const response = await fetch('/api/pages?limit=100', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.data; // Array of pages
};

// Step 3: Assign pages to the role
const assignPagesToRole = async (roleId: number, pageIds: number[]) => {
  for (const pageId of pageIds) {
    await fetch(`/api/roles/${roleId}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_id: pageId })
    });
  }
};

// Usage
const roleId = await createRole();
const pages = await getPages();
const selectedPageIds = [1, 3, 5]; // Pages selected by admin
await assignPagesToRole(roleId, selectedPageIds);
```

### Example 2: Admin Creates User with Roles

```typescript
// Admin creates a user with specific roles (admin-only endpoint)
const createUserWithRoles = async (
  email: string,
  password: string,
  username: string,
  roleIds: number[],
  token: string
) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // Admin token required
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      username,
      role_ids: roleIds, // Can assign roles during creation
    })
  });
  
  return response.json();
};

// Usage
await createUserWithRoles(
  'finance@example.com',
  'password123',
  'finance_user',
  [2], // finance role
  adminToken
);
```

### Example 3: Admin Assigns Role to Existing User

```typescript
const assignRoleToUser = async (userId: number, roleId: number, token: string) => {
  const response = await fetch(`/api/users/${userId}/roles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // Admin token required
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role_id: roleId })
  });
  
  return response.json();
};

// Usage
await assignRoleToUser(5, 10, adminToken); // Assign role 10 to user 5
```

### Example 4: Frontend Route Guard

```typescript
// React Router v6 example
import { Routes, Route, Navigate } from 'react-router-dom';

function AppRoutes() {
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          allowedPages.includes('/dashboard') 
            ? <DashboardPage /> 
            : <Navigate to="/unauthorized" />
        } 
      />
      
      <Route 
        path="/students" 
        element={
          allowedPages.includes('/students') 
            ? <StudentsPage /> 
            : <Navigate to="/unauthorized" />
        } 
      />
      
      <Route 
        path="/payments" 
        element={
          allowedPages.includes('/payments') 
            ? <PaymentsPage /> 
            : <Navigate to="/unauthorized" />
        } 
      />
      
      {/* Admin only routes */}
      <Route 
        path="/admin/roles" 
        element={
          hasRole('admin') && allowedPages.includes('/admin/roles')
            ? <RolesManagementPage />
            : <Navigate to="/unauthorized" />
        } 
      />
      
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
```

### Example 5: User Management UI (Admin Only)

```typescript
// User Management Component - Admin creates users with roles
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const token = localStorage.getItem('token');

  // Load users and roles
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    const response = await fetch('/api/users?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUsers(data.data);
  };

  const loadRoles = async () => {
    const response = await fetch('/api/roles?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setRoles(data.data);
  };

  // Create user with roles (admin-only)
  const handleCreateUser = async (formData: {
    email: string;
    password: string;
    username: string;
    role_ids: number[];
  }) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      await loadUsers();
      setShowCreateForm(false);
      alert('User created successfully');
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>User Management (Admin Only)</h2>
      
      <button onClick={() => setShowCreateForm(true)}>
        Create New User
      </button>

      {showCreateForm && (
        <CreateUserForm
          roles={roles}
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <UserList users={users} roles={roles} token={token} />
    </div>
  );
}

// Create User Form Component
function CreateUserForm({ roles, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role_ids: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleRole = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter(id => id !== roleId)
        : [...prev.role_ids, roleId]
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      <input
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        placeholder="Username"
        required
      />
      
      <div>
        <h3>Assign Roles:</h3>
        {roles.map(role => (
          <label key={role.id}>
            <input
              type="checkbox"
              checked={formData.role_ids.includes(role.id)}
              onChange={() => toggleRole(role.id)}
            />
            {role.label} ({role.code})
          </label>
        ))}
      </div>

      <button type="submit">Create User</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
```

### Example 6: Complete Role Management UI Flow

```typescript
// Role Management Component
function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [availablePages, setAvailablePages] = useState([]);
  const [assignedPages, setAssignedPages] = useState([]);

  // Load roles
  useEffect(() => {
    fetch('/api/roles?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRoles(data.data));
  }, []);

  // Load pages for selected role
  const loadRolePages = async (roleId: number) => {
    const response = await fetch(`/api/roles/${roleId}/pages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const pages = await response.json();
    setAssignedPages(pages.map(p => p.id));
  };

  // Assign page to role
  const assignPage = async (pageId: number) => {
    await fetch(`/api/roles/${selectedRole.id}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_id: pageId })
    });
    
    await loadRolePages(selectedRole.id);
  };

  // Remove page from role
  const removePage = async (pageId: number) => {
    await fetch(`/api/roles/${selectedRole.id}/pages/${pageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    await loadRolePages(selectedRole.id);
  };

  return (
    <div>
      <h2>Role Management</h2>
      
      {/* Role List */}
      <div>
        {roles.map(role => (
          <button 
            key={role.id}
            onClick={() => {
              setSelectedRole(role);
              loadRolePages(role.id);
            }}
          >
            {role.label} {role.is_system && '(System)'}
          </button>
        ))}
      </div>

      {/* Page Assignment */}
      {selectedRole && (
        <div>
          <h3>Pages for {selectedRole.label}</h3>
          {availablePages.map(page => (
            <div key={page.id}>
              <input
                type="checkbox"
                checked={assignedPages.includes(page.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    assignPage(page.id);
                  } else {
                    removePage(page.id);
                  }
                }}
              />
              <label>{page.title} ({page.route})</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ⚠️ Important Notes

### Security

1. **Backend Validation**: The backend validates all role and page assignments. Frontend checks are for UX only.

2. **Token Storage**: Store JWT tokens securely. Consider using httpOnly cookies for production.

3. **Permission Refresh**: When roles are updated, users should re-login or refresh permissions.

### Admin-Only Endpoints

All role and page management endpoints require:
- Valid JWT token
- User must have `admin` role

The backend will return `403 Forbidden` if a non-admin tries to access these endpoints.

### System Roles

- System roles (`is_system: true`) cannot be deleted
- System roles' `code` cannot be changed
- System roles are available to all companies

### Custom Roles

- Custom roles are company-specific
- Custom roles can be created, updated, and deleted by admins
- Custom roles follow the same page assignment rules as system roles

---

## 🔄 Complete Flow Example

### Scenario: Admin creates "Accountant" role and assigns it to a user

1. **Admin creates role:**
   ```http
   POST /api/roles
   {
     "code": "accountant",
     "label": "Accountant",
     "is_system": false
   }
   ```
   → Returns role with `id: 10`

2. **Admin assigns pages to role:**
   ```http
   POST /api/roles/10/pages
   { "page_id": 1 }  // Dashboard
   
   POST /api/roles/10/pages
   { "page_id": 3 }  // Payments
   ```

3. **Admin assigns role to user:**
   ```http
   POST /api/users/5/roles
   { "role_id": 10 }
   ```

4. **User logs in:**
   ```http
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```
   → Returns `allowedPages: ["/dashboard", "/payments"]`

5. **Frontend restricts access:**
   - User can only see Dashboard and Payments in menu
   - User can only navigate to `/dashboard` and `/payments`
   - All other routes redirect to `/unauthorized`

---

## 📞 Support

For API issues or questions, refer to:
- Swagger documentation: `/api-docs` (if enabled)
- Backend logs for detailed error messages
- This guide for implementation patterns
