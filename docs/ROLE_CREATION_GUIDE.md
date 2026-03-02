# Admin Role Creation Guide - Frontend Implementation

## 🎯 Overview

Admins can create **custom roles** for their company. This guide shows exactly how to implement role creation in the frontend.

---

## ✅ What Admins Can Do

1. **Create custom roles** - Company-specific roles (e.g., "Accountant", "Librarian")
2. **View all roles** - System roles + custom roles
3. **Update custom roles** - Change label, but not code
4. **Delete custom roles** - Only custom roles (system roles cannot be deleted)
5. **Assign pages to roles** - Control what pages each role can access

---

## 📋 API Endpoints

### 1. List All Roles

```http
GET /api/roles?page=1&limit=10&search=accountant
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "data": [
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
    },
    {
      "id": 10,
      "code": "accountant",
      "label": "Accountant",
      "company_id": 1,
      "is_system": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3
  }
}
```

---

### 2. Create New Role (Admin Only)

```http
POST /api/roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "accountant",
  "label": "Accountant",
  "is_system": false
}
```

**Important Notes:**
- ✅ `code` - Unique identifier (e.g., "accountant", "librarian")
- ✅ `label` - Human-readable name (e.g., "Accountant", "Librarian")
- ❌ `is_system` - Must be `false` (system roles are seeded, not created via API)
- ❌ `company_id` - Automatically set from authenticated admin's company

**Response:**
```json
{
  "id": 10,
  "code": "accountant",
  "label": "Accountant",
  "company_id": 1,
  "is_system": false,
  "created_at": "2024-01-15T00:00:00.000Z",
  "updated_at": "2024-01-15T00:00:00.000Z"
}
```

**Validation Rules:**
- `code` must be unique within the company
- `code` must be lowercase, alphanumeric with underscores
- `label` is required
- `is_system` must be `false` (or omitted)

---

### 3. Update Role

```http
PATCH /api/roles/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "label": "Senior Accountant"
}
```

**Note:** Cannot change `code` or `is_system` for system roles.

---

### 4. Delete Role

```http
DELETE /api/roles/:id
Authorization: Bearer <admin_token>
```

**Note:** Cannot delete system roles (`is_system: true`). Returns error if attempted.

---

## 💻 Frontend Implementation

### Complete Role Creation Component

```typescript
import { useState, useEffect } from 'react';

function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  // Load roles on mount
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch('http://localhost:3000/roles?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const { data } = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate
    if (!formData.code || !formData.label) {
      setError('Code and label are required');
      setLoading(false);
      return;
    }

    // Validate code format (lowercase, alphanumeric, underscores)
    if (!/^[a-z0-9_]+$/.test(formData.code)) {
      setError('Code must be lowercase, alphanumeric with underscores only');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: formData.code.toLowerCase(),
          label: formData.label,
          is_system: false  // Always false for custom roles
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create role');
      }

      const newRole = await response.json();
      
      // Refresh roles list
      await loadRoles();
      
      // Reset form
      setFormData({ code: '', label: '' });
      setShowCreateForm(false);
      
      alert('Role created successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

    try {
      const response = await fetch(`http://localhost:3000/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete role');
      }

      await loadRoles();
      alert('Role deleted successfully!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="role-management">
      <h2>Role Management</h2>
      
      <button onClick={() => setShowCreateForm(true)}>
        Create New Role
      </button>

      {showCreateForm && (
        <form onSubmit={handleCreateRole} className="create-role-form">
          <h3>Create New Role</h3>
          
          {error && <div className="error">{error}</div>}
          
          <div>
            <label>
              Role Code * (e.g., "accountant", "librarian")
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                placeholder="accountant"
                required
                pattern="[a-z0-9_]+"
                title="Lowercase, alphanumeric, underscores only"
              />
            </label>
            <small>Lowercase, alphanumeric, underscores only</small>
          </div>
          
          <div>
            <label>
              Role Label * (e.g., "Accountant", "Librarian")
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Accountant"
                required
              />
            </label>
          </div>
          
          <div>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Role'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ code: '', label: '' });
                setError('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="roles-list">
        <h3>All Roles</h3>
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
                <td>
                  {role.is_system ? (
                    <span className="badge system">System</span>
                  ) : (
                    <span className="badge custom">Custom</span>
                  )}
                </td>
                <td>
                  <Link to={`/roles/${role.id}/pages`}>
                    Manage Pages
                  </Link>
                  {!role.is_system && (
                    <>
                      <button onClick={() => handleEditRole(role)}>Edit</button>
                      <button 
                        onClick={() => handleDeleteRole(role.id, role.is_system)}
                        className="danger"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RoleManagement;
```

---

## 🎯 Complete Workflow Example

### Step 1: Admin Creates Custom Role

```typescript
// Admin creates "Accountant" role
const response = await fetch('http://localhost:3000/roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: 'accountant',
    label: 'Accountant',
    is_system: false
  })
});

const newRole = await response.json();
// { id: 10, code: "accountant", label: "Accountant", ... }
```

### Step 2: Admin Assigns Pages to Role

```typescript
// Assign pages to accountant role
const pagesToAssign = [5, 6]; // Page IDs

for (const pageId of pagesToAssign) {
  await fetch(`http://localhost:3000/roles/${newRole.id}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page_id: pageId })
  });
}
```

### Step 3: Admin Creates User with New Role

```typescript
// Create user with accountant role
await fetch('http://localhost:3000/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'accountant@company.com',
    username: 'accountant',
    role_ids: [newRole.id]  // ✅ Use the new role ID
  })
});
```

---

## ⚠️ Important Rules

1. **System Roles:**
   - Cannot be created via API (seeded on startup)
   - Cannot be deleted
   - Cannot change `code`
   - Available to all companies

2. **Custom Roles:**
   - Created by admin via API
   - Company-specific (belongs to admin's company)
   - Can be updated and deleted
   - Must have unique `code` within company

3. **Role Code Validation:**
   - Must be lowercase
   - Alphanumeric + underscores only
   - Must be unique within company
   - Examples: `accountant`, `librarian`, `hr_manager`

---

## 🔍 Common Errors

### Error: "Role code already exists"
**Cause:** Another role with same code exists in company

**Solution:** Use a different code or check existing roles first

### Error: "Cannot delete system role"
**Cause:** Trying to delete a role with `is_system: true`

**Solution:** Only delete custom roles (check `is_system` before delete)

### Error: "Invalid code format"
**Cause:** Code contains invalid characters

**Solution:** Use only lowercase letters, numbers, and underscores

---

## ✅ Checklist

- [ ] Create role form with code and label fields
- [ ] Validate code format (lowercase, alphanumeric, underscores)
- [ ] Call `POST /roles` to create role
- [ ] Show success/error messages
- [ ] Refresh roles list after creation
- [ ] Display system vs custom roles differently
- [ ] Prevent deleting system roles
- [ ] Allow editing custom roles
- [ ] Show "Manage Pages" link for each role

---

## 📚 Related Documentation

- `docs/RBAC_FRONTEND_GUIDE.md` - Complete RBAC guide
- `docs/FRONTEND_IMPLEMENTATION_CHECKLIST.md` - Full checklist
- `docs/RBAC_API_ENDPOINTS_SUMMARY.md` - API reference
