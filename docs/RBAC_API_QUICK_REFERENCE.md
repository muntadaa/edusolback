# RBAC API - Quick Reference

## 🔑 Authentication

### Login
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
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john.doe",
    "roles": ["admin", "finance"],
    "allowedPages": ["/dashboard", "/students", "/payments"],
    "company_id": 1
  }
}
```

### Get Current User Routes
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

## 👥 Roles Management (Admin Only)

### List Roles
```http
GET /roles?page=1&limit=10&search=admin&is_system=true
Authorization: Bearer <token>
```

### Create Role
```http
POST /roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "accountant",
  "label": "Accountant",
  "is_system": false
}
```

### Get Role
```http
GET /roles/:id
Authorization: Bearer <token>
```

### Update Role
```http
PATCH /roles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Updated Label"
}
```

### Delete Role
```http
DELETE /roles/:id
Authorization: Bearer <token>
```
⚠️ Cannot delete system roles

---

## 📄 Role-Page Assignments (Admin Only)

### Get Pages for Role
```http
GET /roles/:id/pages
Authorization: Bearer <token>
```

### Assign Page to Role
```http
POST /roles/:id/pages
Authorization: Bearer <token>
Content-Type: application/json

{
  "page_id": 5
}
```

### Remove Page from Role
```http
DELETE /roles/:id/pages/:pageId
Authorization: Bearer <token>
```

### Alternative: Assign via Pages Endpoint
```http
POST /pages/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_id": 2,
  "page_id": 5
}
```

### Get Roles for Page
```http
GET /pages/page/:pageId/roles
Authorization: Bearer <token>
```

---

## 🔗 User-Role Assignments (Admin Only)

### Get User Roles
```http
GET /users/:userId/roles
Authorization: Bearer <token>
```

### Assign Role to User
```http
POST /users/:userId/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_id": 2
}
```

### Remove Role from User
```http
DELETE /users/:userId/roles/:roleId
Authorization: Bearer <token>
```

---

## 🎯 Frontend Implementation Checklist

- [ ] Store `roles` and `allowedPages` from login response
- [ ] Implement route guards based on `allowedPages`
- [ ] Filter menu items by `allowedPages`
- [ ] Hide/show UI elements based on `roles`
- [ ] Call `/pages/my-routes` to refresh permissions when needed
- [ ] Redirect unauthorized users to `/unauthorized` page

---

## 🔒 Security Notes

1. **All admin endpoints require:**
   - Valid JWT token
   - User must have `admin` role

2. **System roles:**
   - Cannot be deleted
   - Cannot change `code`
   - Available to all companies

3. **Custom roles:**
   - Company-specific
   - Can be fully managed by admins

4. **Page Access:**
   - Users with `admin` role get access to ALL pages in their company
   - Other users only get pages assigned to their roles
