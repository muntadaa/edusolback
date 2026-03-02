# Frontend Implementation Checklist - Complete RBAC System

## 📋 Overview

This document provides a complete checklist and implementation guide for all RBAC features. Use this to verify what's already implemented and what needs to be done.

---

## ✅ Implementation Checklist

### 1. Registration Flow (Company + User Creation)

- [ ] **Registration Page** (`/registerMyschool`)
  - [ ] Form to create company (name, email, optional: phone, city, country)
  - [ ] Form to create first admin user (email, password, username)
  - [ ] Single-step or two-step registration flow
  - [ ] No JWT token required (public endpoint)
  - [ ] Handle success: redirect to login or auto-login
  - [ ] Handle errors: display validation messages

- [ ] **API Integration**
  - [ ] `POST /company` - Create company (public, no auth)
  - [ ] `POST /auth/register` - Register first user with `company_id` (public, no auth)
  - [ ] Verify first user automatically gets admin role

---

### 2. Authentication & Authorization

- [ ] **Login Flow**
  - [ ] Login form (email, password)
  - [ ] Store JWT token securely (localStorage/sessionStorage)
  - [ ] Store user data: `roles`, `allowedPages`, `company_id`
  - [ ] Redirect based on user roles/permissions

- [ ] **Login Response Handling**
  - [ ] Extract `roles` array from response
  - [ ] Extract `allowedPages` array from response
  - [ ] Store in state management (Redux/Context/Zustand)
  - [ ] Update UI based on roles and allowed pages

- [ ] **Token Management**
  - [ ] Include JWT token in all authenticated requests
  - [ ] Handle token expiration (401 errors)
  - [ ] Auto-refresh or redirect to login on token expiry

---

### 3. Dynamic Routing & Page Access

- [ ] **Route Protection**
  - [ ] Create route guard/middleware component
  - [ ] Check if route exists in `allowedPages` array
  - [ ] Redirect to unauthorized page if access denied
  - [ ] Protect all routes except public ones (login, register)

- [ ] **Dynamic Menu/Navigation**
  - [ ] Build menu from `allowedPages` array
  - [ ] Hide menu items user cannot access
  - [ ] Update menu when roles change
  - [ ] Show different menus for different roles

- [ ] **Page-Level Access Control**
  - [ ] Check permissions before rendering page content
  - [ ] Show "Access Denied" message if needed
  - [ ] Hide buttons/actions user cannot perform

---

### 4. Role Management (Admin Only)

- [ ] **List Roles**
  - [ ] `GET /roles` - Fetch all roles (system + custom)
  - [ ] Display roles in table/list
  - [ ] Show role code, label, is_system flag
  - [ ] Pagination if needed

- [ ] **Create Role**
  - [ ] Form: code, label
  - [ ] `POST /roles` - Create new role
  - [ ] Validate code uniqueness
  - [ ] Show success/error messages

- [ ] **Update Role**
  - [ ] `PATCH /roles/:id` - Update role
  - [ ] Prevent editing system role codes
  - [ ] Show validation errors

- [ ] **Delete Role**
  - [ ] `DELETE /roles/:id` - Delete role
  - [ ] Prevent deleting system roles
  - [ ] Confirm before deletion

---

### 5. Role-Page Assignment (Admin Only)

- [ ] **View Pages for Role**
  - [ ] `GET /roles/:id/pages` - Get pages assigned to role
  - [ ] Display assigned pages
  - [ ] Show available pages to assign

- [ ] **Assign Page to Role**
  - [ ] `POST /roles/:id/pages` - Assign page
  - [ ] UI: checkbox or drag-and-drop interface
  - [ ] Batch assign multiple pages
  - [ ] Real-time update after assignment

- [ ] **Remove Page from Role**
  - [ ] `DELETE /roles/:id/pages/:pageId` - Remove page
  - [ ] Confirm before removal
  - [ ] Update UI immediately

---

### 6. User Management (Admin Only)

- [ ] **List Users**
  - [ ] `GET /users` - Fetch all users with pagination
  - [ ] Display user list with roles
  - [ ] Search and filter functionality
  - [ ] Show user roles as badges/tags

- [ ] **Create User with Roles (REQUIRED)**
  - [ ] Form: email, username, **role_ids** (REQUIRED), password (OPTIONAL)
  - [ ] `POST /users` - Create user (admin-only)
  - [ ] Multi-select for roles (at least one required)
  - [ ] Validate: must select at least one role
  - [ ] Show error if no roles selected
  - [ ] Password is optional - if not provided, password setup email will be sent
  - [ ] Show message: "Password setup email will be sent" if password field is empty

- [ ] **View User Roles**
  - [ ] `GET /users/:id/roles` - Get user's roles
  - [ ] Display user's current roles
  - [ ] Show role management UI

- [ ] **Assign Role to User**
  - [ ] `POST /users/:id/roles` - Assign role
  - [ ] UI: dropdown or multi-select
  - [ ] Update user roles list

- [ ] **Remove Role from User**
  - [ ] `DELETE /users/:id/roles/:roleId` - Remove role
  - [ ] Confirm before removal
  - [ ] Update UI immediately

---

### 7. UI/UX Features

- [ ] **Loading States**
  - [ ] Show loading spinners during API calls
  - [ ] Disable buttons during requests
  - [ ] Prevent duplicate submissions

- [ ] **Error Handling**
  - [ ] Display API error messages
  - [ ] Handle network errors
  - [ ] Show validation errors from backend
  - [ ] User-friendly error messages

- [ ] **Success Messages**
  - [ ] Show success notifications
  - [ ] Auto-dismiss after few seconds
  - [ ] Update UI after successful operations

- [ ] **Role-Based UI**
  - [ ] Show/hide buttons based on roles
  - [ ] Different layouts for admin vs regular users
  - [ ] Role badges/indicators

---

## 🚀 Complete Implementation Guide

### Step 1: Registration Page (`/registerMyschool`)

**Flow:**
1. User fills company form → Create company
2. User fills user form → Register user with `company_id`
3. First user automatically becomes admin
4. Redirect to login or auto-login

**Code Example:**

```typescript
// Registration Component
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterMySchool() {
  const [step, setStep] = useState(1); // 1: Company, 2: User
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
  });
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Step 1: Create Company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create company');
      }

      const company = await response.json();
      // Store company_id for next step
      localStorage.setItem('temp_company_id', company.id);
      setStep(2); // Move to user registration step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Register User (First Admin)
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const companyId = localStorage.getItem('temp_company_id');
    if (!companyId) {
      setError('Company ID not found. Please start over.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          company_id: parseInt(companyId),
          // No role_ids needed - first user automatically gets admin role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register user');
      }

      const result = await response.json();
      
      // Clear temp data
      localStorage.removeItem('temp_company_id');
      
      // Success! First user is now admin
      alert('Registration successful! You are now the admin. Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Register My School</h1>
      
      {error && <div className="error">{error}</div>}

      {step === 1 ? (
        <form onSubmit={handleCreateCompany}>
          <h2>Step 1: Create Your Company</h2>
          
          <input
            type="text"
            placeholder="Company Name *"
            value={companyData.name}
            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
            required
          />
          
          <input
            type="email"
            placeholder="Company Email *"
            value={companyData.email}
            onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
            required
          />
          
          <input
            type="text"
            placeholder="Phone (optional)"
            value={companyData.phone}
            onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
          />
          
          <input
            type="text"
            placeholder="City (optional)"
            value={companyData.city}
            onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
          />
          
          <input
            type="text"
            placeholder="Country (optional)"
            value={companyData.country}
            onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Next: Create Admin Account'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterUser}>
          <h2>Step 2: Create Admin Account</h2>
          <p>You will automatically become the admin for your company.</p>
          
          <input
            type="text"
            placeholder="Username *"
            value={userData.username}
            onChange={(e) => setUserData({ ...userData, username: e.target.value })}
            required
          />
          
          <input
            type="email"
            placeholder="Email *"
            value={userData.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            required
          />
          
          <input
            type="password"
            placeholder="Password *"
            value={userData.password}
            onChange={(e) => setUserData({ ...userData, password: e.target.value })}
            required
            minLength={6}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
          
          <button type="button" onClick={() => setStep(1)}>
            Back
          </button>
        </form>
      )}
    </div>
  );
}

export default RegisterMySchool;
```

---

### Step 2: Login & Store User Data

```typescript
// Login Component
function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('token', data.token);
      
      // Store user data with roles and allowedPages
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('roles', JSON.stringify(data.user.roles));
      localStorage.setItem('allowedPages', JSON.stringify(data.user.allowedPages));
      localStorage.setItem('company_id', data.user.company_id.toString());
      
      // Redirect based on role or default dashboard
      navigate(data.user.allowedPages[0] || '/dashboard');
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
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
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

### Step 3: Route Protection

```typescript
// Route Guard Component
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredPage }: { children: JSX.Element, requiredPage?: string }) {
  const token = localStorage.getItem('token');
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  const currentPath = window.location.pathname;

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Check if user has access to this page
  if (requiredPage && !allowedPages.includes(requiredPage)) {
    return <Navigate to="/unauthorized" />;
  }

  // Check if current path is in allowedPages
  if (!allowedPages.includes(currentPath)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Usage in Router
<Route
  path="/dashboard"
  element={
    <ProtectedRoute requiredPage="/dashboard">
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

### Step 4: Dynamic Menu

```typescript
// Navigation Component
function Navigation() {
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const isAdmin = roles.includes('admin');

  // Map routes to menu labels
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/students', label: 'Students' },
    { path: '/payments', label: 'Payments' },
    { path: '/reports', label: 'Reports' },
  ];

  // Filter menu items based on allowedPages
  const visibleMenuItems = menuItems.filter(item => 
    allowedPages.includes(item.path)
  );

  return (
    <nav>
      {visibleMenuItems.map(item => (
        <Link key={item.path} to={item.path}>
          {item.label}
        </Link>
      ))}
      
      {isAdmin && (
        <>
          <Link to="/roles">Manage Roles</Link>
          <Link to="/users">Manage Users</Link>
        </>
      )}
    </nav>
  );
}
```

---

### Step 5: Admin - Create User with Roles (REQUIRED)

**Important:** Password is **OPTIONAL**. If not provided, the system will:
- Generate a secure token
- Send a password setup email to the user
- Create user with status 2 (pending) - becomes active after setting password

```typescript
// Create User Component (Admin Only)
function CreateUser() {
  const [formData, setFormData] = useState({
    email: '',
    password: '', // OPTIONAL - if empty, email will be sent
    username: '',
    role_ids: [] as number[], // REQUIRED
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Load available roles
    fetch('http://localhost:3000/roles?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRoles(data.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate: at least one role required
    if (formData.role_ids.length === 0) {
      alert('Please select at least one role');
      return;
    }

    setLoading(true);

    try {
      // Prepare request body - omit password if empty
      const requestBody: any = {
        email: formData.email,
        username: formData.username,
        role_ids: formData.role_ids,
      };
      
      // Only include password if provided
      if (formData.password && formData.password.trim() !== '') {
        requestBody.password = formData.password;
      }

      const response = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      
      // Show appropriate message based on whether password was provided
      if (!formData.password || formData.password.trim() === '') {
        alert('User created successfully! A password setup email has been sent to the user.');
      } else {
        alert('User created successfully!');
      }
      
      // Reset form or redirect
      setFormData({
        email: '',
        password: '',
        username: '',
        role_ids: [],
      });
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
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
      <h2>Create New User</h2>
      
      <input
        type="email"
        placeholder="Email *"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="Username *"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        required
      />
      
      <div>
        <label>
          Password (Optional)
          <input
            type="password"
            placeholder="Leave empty to send password setup email"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </label>
        <small>
          {formData.password ? 
            'User will be created with this password' : 
            'Password setup email will be sent to user'}
        </small>
      </div>
      
      <div>
        <h3>Select Roles * (At least one required)</h3>
        {roles.map((role: any) => (
          <label key={role.id}>
            <input
              type="checkbox"
              checked={formData.role_ids.includes(role.id)}
              onChange={() => toggleRole(role.id)}
            />
            {role.label} ({role.code})
          </label>
        ))}
        {formData.role_ids.length === 0 && (
          <p className="error">Please select at least one role</p>
        )}
      </div>
      
      <button type="submit" disabled={loading || formData.role_ids.length === 0}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

---

### Step 6: Admin - Role Management

```typescript
// Roles Management Component
function RolesManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const response = await fetch('http://localhost:3000/roles?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setRoles(data.data);
  };

  const handleCreateRole = async (code: string, label: string) => {
    const response = await fetch('http://localhost:3000/roles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, label, is_system: false })
    });
    
    if (response.ok) {
      await loadRoles();
      alert('Role created successfully');
    }
  };

  const handleDeleteRole = async (roleId: number, isSystem: boolean) => {
    if (isSystem) {
      alert('Cannot delete system roles');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this role?')) {
      return;
    }

    const response = await fetch(`http://localhost:3000/roles/${roleId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      await loadRoles();
      alert('Role deleted successfully');
    }
  };

  return (
    <div>
      <h2>Roles Management</h2>
      
      {/* Create Role Form */}
      <CreateRoleForm onSubmit={handleCreateRole} />
      
      {/* Roles List */}
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Label</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role: any) => (
            <tr key={role.id}>
              <td>{role.code}</td>
              <td>{role.label}</td>
              <td>{role.is_system ? 'System' : 'Custom'}</td>
              <td>
                <Link to={`/roles/${role.id}/pages`}>Manage Pages</Link>
                {!role.is_system && (
                  <button onClick={() => handleDeleteRole(role.id, role.is_system)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Step 7: Admin - Assign Pages to Roles

```typescript
// Role Pages Assignment Component
function RolePagesManagement({ roleId }: { roleId: number }) {
  const [assignedPages, setAssignedPages] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadRolePages();
    loadAllPages();
  }, [roleId]);

  const loadRolePages = async () => {
    const response = await fetch(`http://localhost:3000/roles/${roleId}/pages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setAssignedPages(data);
  };

  const loadAllPages = async () => {
    const response = await fetch('http://localhost:3000/pages?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setAvailablePages(data.data);
  };

  const handleAssignPage = async (pageId: number) => {
    const response = await fetch(`http://localhost:3000/roles/${roleId}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_id: pageId })
    });
    
    if (response.ok) {
      await loadRolePages();
    }
  };

  const handleRemovePage = async (pageId: number) => {
    const response = await fetch(`http://localhost:3000/roles/${roleId}/pages/${pageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      await loadRolePages();
    }
  };

  return (
    <div>
      <h2>Manage Pages for Role</h2>
      
      <h3>Assigned Pages</h3>
      <ul>
        {assignedPages.map((page: any) => (
          <li key={page.id}>
            {page.title} ({page.route})
            <button onClick={() => handleRemovePage(page.id)}>Remove</button>
          </li>
        ))}
      </ul>
      
      <h3>Available Pages</h3>
      <ul>
        {availablePages
          .filter((page: any) => !assignedPages.some((ap: any) => ap.id === page.id))
          .map((page: any) => (
            <li key={page.id}>
              {page.title} ({page.route})
              <button onClick={() => handleAssignPage(page.id)}>Assign</button>
            </li>
          ))}
      </ul>
    </div>
  );
}
```

---

## 🔍 Verification Steps

### Test Registration Flow

1. **Navigate to** `http://localhost:5174/registerMyschool`
2. **Fill company form** → Submit
3. **Fill user form** → Submit
4. **Verify:** User is created with admin role automatically
5. **Login** with created credentials
6. **Verify:** Login response includes `roles: ["admin"]` and `allowedPages` array

### Test User Creation (Admin)

1. **Login as admin**
2. **Navigate to** user creation page
3. **Try to create user without roles** → Should show error
4. **Create user with roles (with password)** → Should succeed, user can login immediately
5. **Create user with roles (without password)** → Should succeed, password setup email sent
6. **Verify:** User has assigned roles
7. **Verify:** User receives email with password setup link (if password not provided)

### Test Role Management

1. **Login as admin**
2. **Create new role** → Verify it appears in list
3. **Try to delete system role** → Should be prevented
4. **Delete custom role** → Should succeed

### Test Page Access

1. **Login as finance user** (with limited pages)
2. **Navigate to restricted page** → Should redirect to unauthorized
3. **Check menu** → Should only show allowed pages
4. **Login as admin** → Should see all pages

---

## 📝 Notes

- All admin endpoints require JWT token in `Authorization: Bearer <token>` header
- Registration endpoints are public (no token needed)
- First user per company automatically gets admin role
- Roles are REQUIRED when admin creates users
- System roles cannot be deleted
- Page access is controlled by `allowedPages` array from login response

---

## 🐛 Common Issues

1. **401 Unauthorized**: Check if token is included in request headers
2. **403 Forbidden**: User doesn't have admin role
3. **400 Bad Request**: Missing required fields (e.g., role_ids for user creation)
4. **Page not accessible**: Check if route is in `allowedPages` array

---

## ✅ Final Checklist

Before marking as complete, verify:

- [ ] Registration page works (company + user creation)
- [ ] First user becomes admin automatically
- [ ] Login stores roles and allowedPages
- [ ] Routes are protected based on allowedPages
- [ ] Menu shows only allowed pages
- [ ] Admin can create users with required roles (password optional - email sent if omitted)
- [ ] Admin can manage roles
- [ ] Admin can assign pages to roles
- [ ] All API calls include proper authentication
- [ ] Error handling is implemented
- [ ] Loading states are shown

---

**Need Help?** Check `docs/RBAC_FRONTEND_GUIDE.md` for detailed API documentation.
