# Migration from Profile to Roles - Frontend Guide

## ⚠️ Breaking Change: Profile Field Removed

The system has been migrated from a simple `profile` string field to a full **Role-Based Access Control (RBAC)** system.

---

## ❌ What Was Removed

### Old System (No Longer Works)
```typescript
// ❌ OLD - DO NOT USE
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "username": "user",
  "company_id": 1,
  "profile": "admin"  // ❌ THIS FIELD NO LONGER EXISTS
}
```

**Error if you send `profile`:**
```json
{
  "statusCode": 400,
  "message": ["property profile should not exist"],
  "error": "Bad Request"
}
```

---

## ✅ New System (Use This)

### Registration (Public)
```typescript
// ✅ NEW - CORRECT
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "username": "user",
  "company_id": 1
  // ✅ No profile field
  // ✅ No role_ids field (first user gets admin automatically)
}
```

**What happens:**
- First user for company → Automatically gets `admin` role
- Subsequent users → Created without roles (admin assigns later)

---

### User Creation (Admin Only)
```typescript
// ✅ NEW - Admin creates users with roles
POST /users
Authorization: Bearer <admin_token>
{
  "email": "user@example.com",
  "username": "user",
  "password": "password123",  // Optional
  "role_ids": [2, 3]  // ✅ REQUIRED - array of role IDs
}
```

**Key differences:**
- `profile` string → `role_ids` array (REQUIRED)
- Multiple roles can be assigned
- Roles are stored in separate `roles` table
- User-roles relationship in `user_roles` table (backend handles automatically)

**🔗 Important:** You don't need to directly interact with the `user_roles` table. Just send `role_ids` in your request, and the backend automatically creates the relationships in the `user_roles` table.

---

## 🔄 Migration Steps for Frontend

### Step 1: Remove `profile` Field

**Before:**
```typescript
const registerData = {
  email: formData.email,
  password: formData.password,
  username: formData.username,
  company_id: companyId,
  profile: 'admin'  // ❌ REMOVE THIS
};
```

**After:**
```typescript
const registerData = {
  email: formData.email,
  password: formData.password,
  username: formData.username,
  company_id: companyId
  // ✅ No profile field - first user gets admin automatically
};
```

---

### Step 2: Update User Creation Forms

**Before:**
```typescript
// ❌ OLD - Profile dropdown
<select name="profile">
  <option value="admin">Admin</option>
  <option value="finance">Finance</option>
  <option value="student">Student</option>
</select>
```

**After:**
```typescript
// ✅ NEW - Role multi-select
<div>
  <h3>Select Roles * (At least one required)</h3>
  {roles.map((role) => (
    <label key={role.id}>
      <input
        type="checkbox"
        checked={selectedRoleIds.includes(role.id)}
        onChange={() => toggleRole(role.id)}
      />
      {role.label} ({role.code})
    </label>
  ))}
</div>
```

---

### Step 3: Fetch Roles from API

**Before:**
```typescript
// ❌ OLD - Hard-coded profiles
const profiles = ['admin', 'finance', 'student'];
```

**After:**
```typescript
// ✅ NEW - Fetch roles from API
useEffect(() => {
  fetch('http://localhost:3000/roles?limit=100', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setRoles(data.data));
}, []);
```

---

### Step 4: Update Request Bodies

**Registration:**
```typescript
// ✅ Correct registration request
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    username: formData.username,
    company_id: companyId
    // ✅ No profile, no role_ids
  }),
});
```

**User Creation (Admin):**
```typescript
// ✅ Correct user creation request
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: formData.email,
    username: formData.username,
    password: formData.password,  // Optional
    role_ids: selectedRoleIds  // ✅ Array of role IDs (REQUIRED)
  }),
});
```

---

## 📊 Data Structure Changes

### Old System
```typescript
// User object (OLD)
{
  id: 1,
  email: "user@example.com",
  profile: "admin"  // String field
}
```

### New System
```typescript
// User object (NEW)
{
  id: 1,
  email: "user@example.com",
  userRoles: [  // Array of role relationships
    {
      role_id: 1,
      role: {
        id: 1,
        code: "admin",
        label: "Administrator"
      }
    }
  ]
}

// Login response includes roles array
{
  user: {
    id: 1,
    email: "user@example.com",
    roles: ["admin", "finance"],  // Array of role codes
    allowedPages: ["/dashboard", "/students"]
  }
}
```

---

## 🔍 Common Errors & Solutions

### Error 1: "property profile should not exist"
**Cause:** Still sending `profile` field in request

**Solution:**
```typescript
// ❌ Remove this
const data = { ...formData, profile: 'admin' };

// ✅ Use this instead
const data = { ...formData }; // No profile field
```

---

### Error 2: "role_ids are required"
**Cause:** Creating user via `/users` endpoint without `role_ids`

**Solution:**
```typescript
// ✅ Always include role_ids when creating users (admin endpoint)
const data = {
  email: formData.email,
  username: formData.username,
  role_ids: [1, 2]  // ✅ REQUIRED - at least one role
};
```

---

### Error 3: User has no roles after creation
**Cause:** Using `/auth/register` for subsequent users (only first user gets admin)

**Solution:**
- First user → Use `/auth/register` (gets admin automatically)
- Other users → Use `/users` endpoint with `role_ids` (admin only)

---

## ✅ Checklist

Before deploying, verify:

- [ ] Removed all `profile` fields from registration requests
- [ ] Removed all `profile` fields from user creation requests
- [ ] Updated user creation forms to use role multi-select
- [ ] Added API call to fetch roles (`GET /roles`)
- [ ] Updated request bodies to use `role_ids` array (for admin user creation)
- [ ] Removed hard-coded profile dropdowns
- [ ] Updated login response handling to use `roles` array
- [ ] Updated UI to display roles instead of profile
- [ ] Tested registration flow (first user gets admin)
- [ ] Tested user creation flow (admin assigns roles)

---

## 📚 Related Documentation

- `docs/RBAC_FRONTEND_GUIDE.md` - Complete RBAC implementation guide
- `docs/REGISTRATION_PAGE_GUIDE.md` - Registration page implementation
- `docs/FRONTEND_IMPLEMENTATION_CHECKLIST.md` - Full feature checklist

---

## 🆘 Need Help?

If you're still getting errors:
1. Check browser console for request payload
2. Verify no `profile` field is being sent
3. For user creation, ensure `role_ids` array is included
4. Check API response for specific error messages

---

## 🔗 Related Endpoint Changes

### Pages Endpoint Migration

**Old:** `GET /api/pages/profile/finance` ❌ (Removed)

**New Options:**
- `GET /api/pages/my-routes` ✅ (Get current user's pages)
- `GET /api/roles/:id/pages` ✅ (Get pages for a role - admin only)

**See:** `docs/PAGES_ENDPOINT_MIGRATION.md` for complete migration guide.
