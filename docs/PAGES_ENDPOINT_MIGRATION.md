# Pages Endpoint Migration - Profile to Roles

## ⚠️ Breaking Change: Profile-Based Pages Endpoint Removed

The old `/pages/profile/:profile` endpoint has been **removed** and replaced with role-based endpoints.

---

## ❌ Old Endpoint (No Longer Works)

```http
GET /api/pages/profile/finance
Authorization: Bearer <token>
```

**Error:**
```json
{
  "statusCode": 404,
  "message": "Cannot GET /api/pages/profile/finance",
  "error": "Not Found"
}
```

---

## ✅ New Endpoints (Use These)

### Option 1: Get Current User's Allowed Pages (Recommended)

```http
GET /api/pages/my-routes
Authorization: Bearer <token>
```

**Response:**
```json
{
  "routes": ["/dashboard", "/payments", "/students"]
}
```

**Use this when:**
- You want to get pages for the currently logged-in user
- You need to build the navigation menu
- You want to check route access

**Example:**
```typescript
// Get current user's allowed pages
const response = await fetch('http://localhost:3000/pages/my-routes', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { routes } = await response.json();
// routes = ["/dashboard", "/payments"]
```

---

### Option 2: Get Pages for a Specific Role (Admin Only)

```http
GET /api/roles/:roleId/pages
Authorization: Bearer <admin_token>
```

**Example:**
```http
GET /api/roles/2/pages
Authorization: Bearer <admin_token>
```

**Response:**
```json
[
  {
    "id": 5,
    "title": "Payments",
    "route": "/payments",
    "company_id": 1
  },
  {
    "id": 6,
    "title": "Reports",
    "route": "/reports",
    "company_id": 1
  }
]
```

**Use this when:**
- Admin is managing role-page assignments
- Admin wants to see what pages a role can access
- Building role management UI

**Example:**
```typescript
// Get pages for finance role (ID: 2)
const response = await fetch('http://localhost:3000/roles/2/pages', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const pages = await response.json();
// pages = [{ id: 5, title: "Payments", route: "/payments" }, ...]
```

---

### Option 3: Get Pages for Role (Alternative Endpoint)

```http
GET /api/pages/role/:roleId
Authorization: Bearer <admin_token>
```

**Example:**
```http
GET /api/pages/role/2
Authorization: Bearer <admin_token>
```

**Response:** Same as Option 2

---

## 🔄 Migration Steps

### Step 1: Replace Profile-Based Calls

**Before:**
```typescript
// ❌ OLD - Don't use this
const response = await fetch(`/api/pages/profile/${profile}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After:**
```typescript
// ✅ NEW - Use this for current user
const response = await fetch('/api/pages/my-routes', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { routes } = await response.json();
```

---

### Step 2: If You Need Role-Specific Pages

**Before:**
```typescript
// ❌ OLD - Don't use this
const response = await fetch(`/api/pages/profile/finance`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After:**
```typescript
// ✅ NEW - First get role ID, then get pages
// Step 1: Get finance role ID
const rolesResponse = await fetch('/api/roles?limit=100', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const { data: roles } = await rolesResponse.json();
const financeRole = roles.find(r => r.code === 'finance');

// Step 2: Get pages for finance role
const pagesResponse = await fetch(`/api/roles/${financeRole.id}/pages`, {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const pages = await pagesResponse.json();
```

---

## 📝 Complete Example

### Getting Current User's Pages

```typescript
// ✅ Correct way to get current user's allowed pages
async function getUserAllowedPages(token: string) {
  const response = await fetch('http://localhost:3000/pages/my-routes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch allowed pages');
  }
  
  const { routes } = await response.json();
  return routes; // ["/dashboard", "/payments", "/students"]
}

// Usage
const token = localStorage.getItem('token');
const allowedPages = await getUserAllowedPages(token);
```

### Getting Pages for a Role (Admin)

```typescript
// ✅ Correct way to get pages for a specific role
async function getPagesForRole(roleCode: string, adminToken: string) {
  // Step 1: Find role by code
  const rolesResponse = await fetch('http://localhost:3000/roles?limit=100', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const { data: roles } = await rolesResponse.json();
  const role = roles.find(r => r.code === roleCode);
  
  if (!role) {
    throw new Error(`Role ${roleCode} not found`);
  }
  
  // Step 2: Get pages for this role
  const pagesResponse = await fetch(`http://localhost:3000/roles/${role.id}/pages`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (!pagesResponse.ok) {
    throw new Error('Failed to fetch pages for role');
  }
  
  return await pagesResponse.json();
}

// Usage
const adminToken = localStorage.getItem('token');
const financePages = await getPagesForRole('finance', adminToken);
```

---

## 🎯 Common Use Cases

### Use Case 1: Build Navigation Menu

```typescript
// ✅ Get current user's allowed pages
useEffect(() => {
  const loadMenu = async () => {
    const response = await fetch('/api/pages/my-routes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { routes } = await response.json();
    setMenuItems(routes);
  };
  loadMenu();
}, [token]);
```

### Use Case 2: Admin Managing Role Pages

```typescript
// ✅ Get pages for a role to show in role management UI
const loadRolePages = async (roleId: number) => {
  const response = await fetch(`/api/roles/${roleId}/pages`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const pages = await response.json();
  setRolePages(pages);
};
```

### Use Case 3: Check Route Access

```typescript
// ✅ Check if user can access a route
const checkRouteAccess = async (route: string) => {
  const response = await fetch('/api/pages/my-routes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { routes } = await response.json();
  return routes.includes(route);
};

// Usage
const canAccess = await checkRouteAccess('/payments');
if (!canAccess) {
  navigate('/unauthorized');
}
```

---

## ⚠️ Important Notes

1. **`/pages/profile/:profile` is REMOVED** - This endpoint no longer exists
2. **Use `/pages/my-routes`** - For getting current user's allowed pages
3. **Use `/roles/:id/pages`** - For getting pages for a specific role (admin only)
4. **Login response includes `allowedPages`** - You may not need to call this endpoint if you already have it from login

---

## 🔍 Quick Reference

| Old Endpoint | New Endpoint | Purpose |
|--------------|--------------|---------|
| `GET /pages/profile/finance` | `GET /pages/my-routes` | Get current user's pages |
| `GET /pages/profile/finance` | `GET /roles/:id/pages` | Get pages for a role (admin) |
| `GET /pages/profile/:profile` | ❌ Removed | No longer exists |

---

## ✅ Migration Checklist

- [ ] Find all calls to `/pages/profile/:profile`
- [ ] Replace with `/pages/my-routes` for current user
- [ ] Replace with `/roles/:id/pages` for role-specific pages (admin)
- [ ] Update error handling (404 → use new endpoints)
- [ ] Test that pages are correctly loaded
- [ ] Verify navigation menu works
- [ ] Check route guards still work

---

## 🆘 Troubleshooting

### Error: "Cannot GET /api/pages/profile/finance"
**Solution:** Replace with `/pages/my-routes` or `/roles/:id/pages`

### Error: 404 on pages endpoint
**Solution:** Make sure you're using the correct endpoint:
- `/pages/my-routes` (for current user)
- `/roles/:id/pages` (for specific role)

### Pages not showing
**Solution:** 
1. Check if user has roles assigned
2. Check if roles have pages assigned
3. Verify token is valid
4. Check if user is admin (for role-specific endpoints)

---

**Related Documentation:**
- `docs/MIGRATION_FROM_PROFILE_TO_ROLES.md` - Complete profile to roles migration
- `docs/RBAC_FRONTEND_GUIDE.md` - Complete RBAC guide
