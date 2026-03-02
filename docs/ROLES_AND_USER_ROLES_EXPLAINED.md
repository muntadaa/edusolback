# Roles and User-Roles Table - Frontend Guide

## 🎯 Overview

This document explains how roles work in the system and how the frontend interacts with them.

---

## 📊 Database Structure

### Tables Involved

1. **`roles` table** - Stores all available roles
   - `id` - Role ID
   - `code` - Role code (e.g., "admin", "finance")
   - `label` - Human-readable name (e.g., "Administrator")
   - `company_id` - NULL for system roles, company ID for custom roles
   - `is_system` - Boolean (true for system roles)

2. **`user_roles` table** - Links users to roles (many-to-many relationship)
   - `user_id` - User ID
   - `role_id` - Role ID
   - `company_id` - Company ID

3. **`users` table** - User accounts
   - `id` - User ID
   - `email`, `username`, etc.
   - **No `profile` field** (removed)

---

## 🔄 How It Works

### Frontend Perspective

**You send:**
```typescript
POST /users
{
  "email": "user@example.com",
  "username": "user",
  "role_ids": [2, 3]  // ✅ Just send role IDs
}
```

**Backend automatically:**
1. Creates user in `users` table
2. Creates entries in `user_roles` table:
   - `user_id: 1, role_id: 2, company_id: 1`
   - `user_id: 1, role_id: 3, company_id: 1`
3. Returns user with roles assigned

**You receive:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user"
  }
}
```

---

## ✅ What Frontend Needs to Do

### 1. Fetch Available Roles

```typescript
// Get all roles (system + company custom roles)
GET /roles?limit=100
Authorization: Bearer <admin_token>

// Response
{
  "data": [
    { "id": 1, "code": "admin", "label": "Administrator", "is_system": true },
    { "id": 2, "code": "finance", "label": "Finance", "is_system": true },
    { "id": 3, "code": "student", "label": "Student", "is_system": true },
    { "id": 10, "code": "accountant", "label": "Accountant", "is_system": false }
  ]
}
```

### 2. Send Role IDs When Creating User

```typescript
// ✅ CORRECT - Send role_ids array
POST /users
{
  "email": "user@example.com",
  "username": "user",
  "role_ids": [2, 3]  // Array of role IDs
}
```

### 3. Backend Handles user_roles Table

**You DON'T need to:**
- ❌ Directly create entries in `user_roles` table
- ❌ Send `user_id` or `company_id` for roles (backend gets from authenticated user)
- ❌ Manage the relationship table manually

**Backend DOES:**
- ✅ Automatically creates `user_roles` entries
- ✅ Links user to roles using `user_id` and `role_id`
- ✅ Sets `company_id` from authenticated admin's company
- ✅ Validates roles exist and belong to correct company

---

## 📝 Complete Example

### Step 1: Admin Fetches Roles

```typescript
const response = await fetch('http://localhost:3000/roles?limit=100', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const { data: roles } = await response.json();

// roles = [
//   { id: 1, code: "admin", label: "Administrator" },
//   { id: 2, code: "finance", label: "Finance" },
//   { id: 3, code: "student", label: "Student" }
// ]
```

### Step 2: Admin Selects Roles in UI

```typescript
// User selects finance and student roles
const selectedRoleIds = [2, 3]; // Finance and Student
```

### Step 3: Admin Creates User with Roles

```typescript
const response = await fetch('http://localhost:3000/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'user',
    role_ids: [2, 3]  // ✅ Just send the role IDs
  })
});
```

### Step 4: Backend Automatically Creates user_roles Entries

**Backend does this automatically:**
```sql
-- Creates user
INSERT INTO users (email, username, company_id) VALUES (...);

-- Creates user_roles entries (automatic)
INSERT INTO user_roles (user_id, role_id, company_id) VALUES (1, 2, 1);
INSERT INTO user_roles (user_id, role_id, company_id) VALUES (1, 3, 1);
```

### Step 5: User Can Login and See Roles

```typescript
// User logs in
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response includes roles
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "roles": ["finance", "student"],  // ✅ Roles from user_roles table
    "allowedPages": ["/payments", "/students"]
  }
}
```

---

## 🔍 Getting User's Roles

### Option 1: From Login Response (Recommended)

```typescript
// Login response already includes roles
const { user } = await loginResponse.json();
const userRoles = user.roles; // ["admin", "finance"]
```

### Option 2: Get User Details

```typescript
GET /users/:id
Authorization: Bearer <token>

// Response includes userRoles relation
{
  "id": 1,
  "email": "user@example.com",
  "userRoles": [
    {
      "role_id": 2,
      "role": {
        "id": 2,
        "code": "finance",
        "label": "Finance"
      }
    }
  ]
}
```

### Option 3: Get User Roles Endpoint

```typescript
GET /users/:id/roles
Authorization: Bearer <admin_token>

// Response
[
  {
    "id": 2,
    "code": "finance",
    "label": "Finance"
  },
  {
    "id": 3,
    "code": "student",
    "label": "Student"
  }
]
```

---

## ⚠️ Important Notes

1. **Frontend sends `role_ids`** - Array of role IDs (numbers)
2. **Backend creates `user_roles` entries** - Automatically handles the relationship table
3. **No direct `user_roles` API** - You don't create entries directly
4. **Company context** - Backend automatically sets `company_id` from authenticated admin
5. **Role validation** - Backend validates roles exist and belong to correct company

---

## 🎯 Summary

| What | Frontend Does | Backend Does |
|------|---------------|--------------|
| **Fetch roles** | `GET /roles` | Returns available roles |
| **Create user** | `POST /users` with `role_ids` | Creates user + `user_roles` entries |
| **Get user roles** | `GET /users/:id/roles` | Returns user's roles from `user_roles` table |
| **Assign role** | `POST /users/:id/roles` with `role_id` | Creates entry in `user_roles` table |
| **Remove role** | `DELETE /users/:id/roles/:roleId` | Deletes entry from `user_roles` table |

**Key Point:** Frontend only sends `role_ids`. Backend handles all `user_roles` table operations automatically.

---

## 📚 Related Documentation

- `docs/RBAC_FRONTEND_GUIDE.md` - Complete RBAC guide
- `docs/RBAC_API_ENDPOINTS_SUMMARY.md` - API endpoints reference
- `docs/MIGRATION_FROM_PROFILE_TO_ROLES.md` - Migration guide
