# First Admin Setup Guide

## 🚀 Quick Start

When you drop the database and start fresh, you need to create the first admin user. The system provides two methods:

---

## Method 1: Dedicated Setup Endpoint (Recommended)

### Step 1: Check if System is Set Up

```http
GET /auth/check-setup
```

**Response (if not set up):**
```json
{
  "isSetup": false,
  "message": "System is not set up. Use /auth/setup-admin to create the first admin."
}
```

**Response (if already set up):**
```json
{
  "isSetup": true,
  "message": "System is already set up. Use /auth/register or /auth/login instead."
}
```

### Step 2: Create First Admin

```http
POST /auth/setup-admin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123",
  "username": "admin",
  "company_id": 1
}
```

**Response:**
```json
{
  "message": "First admin user created successfully. You can now login.",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "company_id": 1
  }
}
```

**What happens:**
- ✅ Automatically assigns `admin` role to the user
- ✅ No authentication required (public endpoint)
- ✅ Only works if no users exist in the system

---

## Method 2: Regular Register Endpoint

The regular `/auth/register` endpoint automatically assigns admin role **only if it's the first user for that company**:

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "username": "user",
  "company_id": 1
}
```

**Important Notes:**
- ✅ **First user for a company** → Automatically gets `admin` role
- ❌ **Subsequent users** → Created **without roles** (admin must assign roles later via `/users/:id/roles`)
- 🔒 **No authentication required** for registration
- 📝 **No `role_ids` field** - registration doesn't accept role assignment
- 👤 **User creation with roles** is separate and requires admin authentication via `/users` endpoint

**When to use:**
- Use `/auth/register` for public user registration (first user becomes admin automatically)
- Use `/auth/setup-admin` to explicitly create first admin for a company
- Use `/users` endpoint (admin only) to create users with specific roles

---

## ⚠️ Important Prerequisites

### 1. System Roles Must Be Seeded

Before creating the first admin, ensure system roles are seeded. The roles seeder runs automatically on application startup.

**To verify roles are seeded:**
```sql
SELECT * FROM roles WHERE company_id IS NULL;
```

You should see these system roles:
- admin
- finance
- student
- teacher
- direction
- prof
- scholarity
- support

### 2. Company Must Exist

The `company_id` must reference an existing company in the `companies` table.

**To create a company first:**
```http
POST /companies
Content-Type: application/json

{
  "name": "My School",
  "email": "school@example.com"
}
```

---

## 🔄 Complete Setup Flow

### Option A: Using Setup Endpoint

```bash
# 1. Start the application (roles will be seeded automatically)
npm run start

# 2. Check if system is set up
curl -X GET http://localhost:3000/auth/check-setup

# 3. Create first admin
curl -X POST http://localhost:3000/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "username": "admin",
    "company_id": 1
  }'

# 4. Login with the created admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

### Option B: Using Register Endpoint

```bash
# 1. Start the application
npm run start

# 2. Register first admin (automatically gets admin role)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "username": "admin",
    "company_id": 1
  }'

# 3. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

---

## 🐛 Troubleshooting

### Error: "Admin role not found"

**Problem:** System roles haven't been seeded yet.

**Solution:**
1. Restart the application - the `RolesSeederService` runs on startup
2. Check application logs for: `Created system role: admin`
3. Verify roles exist: `SELECT * FROM roles WHERE code = 'admin'`

### Error: "System is already set up"

**Problem:** At least one user already exists.

**Solution:**
- Use `/auth/login` if you know the credentials
- Or use `/auth/register` (will require admin authentication if users exist)

### Error: "company_id is required"

**Problem:** No company exists yet.

**Solution:**
1. Create a company first via `/companies` endpoint
2. Use that company's ID in the setup request

### Error: 401 Unauthorized

**Problem:** You're trying to use `/auth/register` after first user exists.

**Solution:**
- Use `/auth/setup-admin` only when no users exist
- After first user, use `/auth/login` or authenticated `/users` endpoint

---

## 📝 Notes

1. **First User Per Company = Admin**: The first user created for each company is automatically assigned the `admin` role
2. **No Authentication Required**: Both `/auth/register` and `/auth/setup-admin` are public endpoints (no JWT needed)
3. **Company-Specific**: Each company can have its own first admin
4. **No Role Assignment in Registration**: Regular registration doesn't accept `role_ids` - roles are assigned separately
5. **User Creation vs Registration**: 
   - `/auth/register` - Public registration (first user = admin, others = no roles)
   - `/users` endpoint - Admin-only user creation with role assignment
6. **Roles Seeding**: Happens automatically on application startup via `RolesSeederService`
7. **Company Required**: You must have at least one company before creating users

---

## 🔐 Security Considerations

- The setup endpoint is **public** - ensure your application is not exposed to the internet during initial setup
- Consider adding IP whitelist or environment variable check for production
- After setup, the endpoint becomes inactive (returns error if users exist)

---

## ✅ Verification

After creating the first admin, verify:

1. **User was created:**
   ```sql
   SELECT * FROM users WHERE email = 'admin@example.com';
   ```

2. **Admin role was assigned:**
   ```sql
   SELECT ur.*, r.code, r.label 
   FROM user_roles ur
   JOIN roles r ON ur.role_id = r.id
   WHERE ur.user_id = 1;
   ```

3. **Can login:**
   ```http
   POST /auth/login
   {
     "email": "admin@example.com",
     "password": "Admin123!"
   }
   ```

4. **Login response includes admin role:**
   ```json
   {
     "user": {
       "roles": ["admin"],
       "allowedPages": ["/dashboard", "/students", ...]
     }
   }
   ```
