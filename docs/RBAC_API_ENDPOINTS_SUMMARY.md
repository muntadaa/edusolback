# RBAC API Endpoints - Quick Summary for Frontend

## 🔑 Authentication Endpoints

### Public Endpoints (No Auth Required)

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "user",
  "company_id": 1
}
```

**Behavior:**
- ✅ First user for company → Automatically gets `admin` role
- ❌ Subsequent users → Created **without roles**
- 📝 **No `role_ids` field** - registration doesn't accept role assignment
- 🔓 **Public endpoint** - no authentication needed
- ❌ **DO NOT send `profile` field** - This field has been **REMOVED** (replaced with roles system)

**Use for:** Public registration, self-signup, first admin creation

**⚠️ Common Error:**
If you get `"property profile should not exist"` → Remove `profile` field from request. The old profile system has been replaced with RBAC roles.

---

#### 2. Setup First Admin (Alternative)
```http
POST /auth/setup-admin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "username": "admin",
  "company_id": 1
}
```

**Behavior:**
- ✅ Always assigns `admin` role
- ✅ Only works if company has no users
- 🔓 **Public endpoint** - no authentication needed

**Use for:** Explicitly creating first admin for a company

---

#### 3. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user",
    "roles": ["admin"],
    "allowedPages": ["/dashboard", "/students"],
    "company_id": 1
  }
}
```

---

### Protected Endpoints (Require JWT Token)

#### 4. Get Current User Routes
```http
GET /pages/my-routes
Authorization: Bearer <token>
```

**Response:**
```json
{
  "routes": ["/dashboard", "/students", "/payments"]
}
```

---

## 👥 User Management (Admin Only)

### Create User with Roles
```http
POST /users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "user",
  "password": "password123",  // OPTIONAL - if omitted, password setup email is sent
  "role_ids": [2, 3]  // ✅ REQUIRED - at least one role
}
```

**Key Differences from `/auth/register`:**
- ✅ Requires admin authentication
- ✅ Accepts `role_ids` field (REQUIRED)
- ✅ Can assign multiple roles during creation
- ✅ Password is OPTIONAL - if not provided:
  - System generates secure token
  - Sends password setup email to user
  - User created with status 2 (pending)
  - User becomes active after setting password
- ✅ Use for admin-controlled user management

**Use for:** Admin creating users with specific roles

**Password Behavior:**
- **With password:** User created with status 1 (active), can login immediately
- **Without password:** User created with status 2 (pending), receives email with password setup link

**🔗 How Roles Work:**
- **Frontend sends:** `role_ids: [2, 3]` (array of role IDs)
- **Backend automatically:**
  1. Creates user in `users` table
  2. Creates entries in `user_roles` table linking user to roles
  3. Returns created user with roles assigned
- **You don't need to:** Directly interact with `user_roles` table - backend handles it automatically

---

### Get User Roles
```http
GET /users/:userId/roles
Authorization: Bearer <admin_token>
```

### Assign Role to User
```http
POST /users/:userId/roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role_id": 2
}
```

### Remove Role from User
```http
DELETE /users/:userId/roles/:roleId
Authorization: Bearer <admin_token>
```

---

## 🎭 Roles Management (Admin Only)

### List Roles
```http
GET /roles?page=1&limit=10&search=admin
Authorization: Bearer <admin_token>
```

### Create Role
```http
POST /roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "accountant",
  "label": "Accountant",
  "is_system": false
}
```

### Update Role
```http
PATCH /roles/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "label": "Updated Label"
}
```

### Delete Role
```http
DELETE /roles/:id
Authorization: Bearer <admin_token>
```
⚠️ Cannot delete system roles

---

## 📄 Role-Page Assignments (Admin Only)

### Get Pages for Role
```http
GET /roles/:id/pages
Authorization: Bearer <admin_token>
```

### Assign Page to Role
```http
POST /roles/:id/pages
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "page_id": 5
}
```

### Remove Page from Role
```http
DELETE /roles/:id/pages/:pageId
Authorization: Bearer <admin_token>
```

---

## 📋 Frontend Implementation Guide

### Registration Flow

```typescript
// ✅ Public Registration (No Auth)
async function registerUser(data: {
  email: string;
  password: string;
  username: string;
  company_id: number;
}) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    // No Authorization header - public endpoint
  });
  return response.json();
}

// First user → Gets admin role automatically
// Other users → No roles (admin assigns later)
```

### User Creation Flow (Admin Only)

```typescript
// ✅ Admin User Creation (Requires Auth)
async function createUserWithRoles(
  data: {
    email: string;
    password: string;
    username: string;
    role_ids: number[]; // ✅ Can assign roles
  },
  token: string
) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // ✅ Admin token required
    },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

---

## 🔄 Complete User Creation Workflow

### Scenario: Admin creates a finance user

```typescript
// Step 1: Admin logs in
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'admin@example.com', password: '...' })
});
const { token, user } = await loginResponse.json();

// Step 2: Admin gets available roles
const rolesResponse = await fetch('/api/roles?limit=100', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const roles = await rolesResponse.json();
const financeRole = roles.data.find(r => r.code === 'finance');

// Step 3: Admin creates user with finance role
const userResponse = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'finance@example.com',
    password: 'password123',
    username: 'finance_user',
    role_ids: [financeRole.id] // ✅ Assign role during creation
  })
});

// User is created with finance role immediately
```

---

## ⚠️ Important Notes

1. **Registration (`/auth/register`):**
   - Public endpoint
   - No `role_ids` field
   - First user = admin automatically
   - Other users = no roles

2. **User Creation (`/users`):**
   - Admin-only endpoint
   - Requires JWT token
   - Accepts `role_ids` field
   - Can assign roles during creation

3. **Role Assignment:**
   - Can assign roles after user creation via `/users/:id/roles`
   - Or assign during creation via `/users` endpoint with `role_ids`

4. **First Admin:**
   - First user registered for a company automatically becomes admin
   - Or use `/auth/setup-admin` to explicitly create first admin
