# User Creation Guide

## Overview

This guide explains the user creation flow. Users are created directly (similar to students and teachers), but **unlike students and teachers, the password setup email is sent automatically** when a user is created directly. Users are created with a **pending** status and must set their password to become **active**.

## Status Values

- **2 (Pending)**: User is created but hasn't set their password yet
- **1 (Active)**: User has set their password and can log in
- **0 (Disabled)**: User is disabled
- **-1 (Archived)**: User is archived
- **-2 (Deleted)**: User is soft-deleted

## User Creation Flow

### 1. Create User

**Endpoint:** `POST /api/users`

**Request:**
- Content-Type: `application/json`
- Headers: `Authorization: Bearer <token>`

**Body:**
```json
{
  "username": "jane.doe",
  "email": "jane.doe@example.com",
  "profile": "admin",
  "password": null, // optional - if not provided, email will be sent automatically
  "status": 2 // optional, defaults to 2 (pending) if no password, 1 (active) if password provided
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "jane.doe",
    "email": "jane.doe@example.com",
    "profile": "admin",
    "status": 2, // pending
    "company_id": 1,
    "password": null,
    "password_set_token": "<hashed-token>",
    "password_set_token_expires_at": "2026-01-06T10:00:00.000Z",
    "created_at": "2026-01-05T10:00:00.000Z",
    "updated_at": "2026-01-05T10:00:00.000Z"
  }
}
```

**Important Notes:**
- User is created with `status: 2` (pending) by default if no password is provided
- If password is provided, user is created with `status: 1` (active)
- **Email is sent automatically** when creating a user without a password
- The email contains a link to set the password
- `company_id` is automatically set from the authenticated user's company

### 2. User Sets Password

**Endpoint:** `POST /api/auth/set-password`

**Request:**
```json
{
  "token": "<token-from-email-link>",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password has been set successfully. You can now login."
}
```

**What Happens:**
- User password is set and hashed
- **User status changes from 2 (pending) to 1 (active)**
- Password set token is cleared
- User can now log in

### 3. Resend Password Invitation (Optional)

If the user didn't receive the email or the token expired, you can resend the invitation using either endpoint:

**Option 1: By User ID**
**Endpoint:** `POST /api/users/:id/send-password-invitation`

**Request:**
- Headers: `Authorization: Bearer <token>`
- No body required

**Response:**
```json
{
  "message": "Password invitation email sent successfully"
}
```

**Option 2: By Email**
**Endpoint:** `POST /api/users/send-password-invitation-by-email`

**Request:**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "email": "jane.doe@example.com"
}
```

**Response:**
```json
{
  "message": "Password invitation email sent successfully"
}
```

**Note:** Both endpoints regenerate the token and send a new email. The token expires in 24 hours.

## Frontend Implementation Guide

### User Creation Form

```typescript
// Example: Create user form
interface CreateUserForm {
  username: string;
  email: string;
  profile: 'support' | 'admin' | 'finance' | 'student' | 'direction' | 'prof' | 'scholarity' | 'teacher';
  password?: string; // optional - if not provided, email will be sent
}

const createUser = async (formData: CreateUserForm) => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: formData.username,
        email: formData.email,
        profile: formData.profile,
        // Don't send password if you want email to be sent automatically
        // password: formData.password
      })
    });
    
    const result = await response.json();
    
    // Show success message
    showSuccessMessage('User created successfully. Password setup email has been sent automatically.');
    
    return result.user;
  } catch (error) {
    // Handle error
    if (error.response?.status === 400) {
      showErrorMessage(error.response.data.message || 'Failed to create user');
    } else {
      showErrorMessage('An error occurred while creating the user');
    }
  }
};
```

### User List with Status Display

```typescript
// Example: Display users with status badges
const UserList = ({ users }) => {
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 2:
        return <Badge color="orange">Pending</Badge>;
      case 1:
        return <Badge color="green">Active</Badge>;
      case 0:
        return <Badge color="gray">Disabled</Badge>;
      default:
        return <Badge color="red">Unknown</Badge>;
    }
  };

  const getProfileBadge = (profile: string) => {
    const colors = {
      admin: 'purple',
      support: 'blue',
      finance: 'green',
      student: 'yellow',
      teacher: 'orange',
      direction: 'red',
      prof: 'cyan',
      scholarity: 'pink'
    };
    return <Badge color={colors[profile] || 'gray'}>{profile}</Badge>;
  };

  return (
    <Table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Profile</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>{getProfileBadge(user.profile)}</td>
            <td>{getStatusBadge(user.status)}</td>
            <td>
              {user.status === 2 && (
                <Button 
                  onClick={() => resendPasswordInvitationById(user.id)}
                  variant="outline"
                  size="sm"
                >
                  Resend Invitation
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
```

### User Creation Modal/Form Component

```typescript
// Example: User creation form component
const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    profile: 'admin',
    password: '' // Leave empty to trigger automatic email
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Don't send password if empty - this triggers automatic email
      const payload = {
        username: formData.username,
        email: formData.email,
        profile: formData.profile
      };

      // Only include password if user wants to set it directly
      if (formData.password) {
        payload.password = formData.password;
      }

      const user = await createUser(payload);
      
      showSuccessMessage(
        formData.password 
          ? 'User created successfully and is active.'
          : 'User created successfully. Password setup email has been sent automatically.'
      );
      
      onSuccess(user);
      onClose();
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Failed to create user' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>Create New User</ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          {errors.general && (
            <Alert color="danger">{errors.general}</Alert>
          )}

          <FormGroup>
            <Label>Username *</Label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="jane.doe"
            />
          </FormGroup>

          <FormGroup>
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="jane.doe@example.com"
            />
          </FormGroup>

          <FormGroup>
            <Label>Profile *</Label>
            <Select
              value={formData.profile}
              onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
              required
            >
              <option value="admin">Admin</option>
              <option value="support">Support</option>
              <option value="finance">Finance</option>
              <option value="direction">Direction</option>
              <option value="prof">Prof</option>
              <option value="scholarity">Scholarity</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Password (Optional)</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave empty to send password setup email"
            />
            <FormText>
              If left empty, a password setup email will be sent automatically to the user.
            </FormText>
          </FormGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </Form>
      </ModalBody>
    </Modal>
  );
};
```

### Resend Password Invitation

```typescript
// Example: Resend password invitation by email
const resendPasswordInvitationByEmail = async (email: string) => {
  try {
    const response = await fetch('/api/users/send-password-invitation-by-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      const data = await response.json();
      showSuccessMessage(data.message || 'Password invitation email sent successfully');
    } else {
      const error = await response.json();
      showErrorMessage(error.message || 'Failed to send password invitation');
    }
  } catch (error) {
    showErrorMessage('An error occurred while sending the invitation');
  }
};

// Example: Resend password invitation by user ID
const resendPasswordInvitationById = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}/send-password-invitation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      showSuccessMessage(data.message || 'Password invitation email sent successfully');
    } else {
      const error = await response.json();
      showErrorMessage(error.message || 'Failed to send password invitation');
    }
  } catch (error) {
    showErrorMessage('An error occurred while sending the invitation');
  }
};
```

### User Detail View

```typescript
// Example: User detail page with status and actions
const UserDetail = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    const response = await fetch(`/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUser(data);
    setLoading(false);
  };

  const handleResendInvitation = async () => {
    await resendPasswordInvitationById(user.id);
    // Optionally refresh user data
    await fetchUser();
  };

  if (loading) return <Spinner />;

  return (
    <Card>
      <CardHeader>
        <h2>{user.username}</h2>
        <StatusBadge status={user.status} />
        <ProfileBadge profile={user.profile} />
      </CardHeader>
      <CardBody>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Profile:</strong> {user.profile}</p>
        <p><strong>Status:</strong> {getStatusText(user.status)}</p>
        <p><strong>Company:</strong> {user.company?.name}</p>
        
        {user.status === 2 && (
          <div>
            <Alert color="info">
              User is pending password setup. An email was sent automatically when the user was created.
            </Alert>
            <Button 
              onClick={handleResendInvitation}
              variant="primary"
              className="mt-3"
            >
              Resend Password Invitation Email
            </Button>
          </div>
        )}
        
        {user.status === 1 && (
          <Badge color="success">
            User has set password and is active
          </Badge>
        )}
      </CardBody>
    </Card>
  );
};
```

## UI/UX Recommendations

### 1. Status Indicators
- **Pending (2)**: Show orange/yellow badge with "Pending" text
- **Active (1)**: Show green badge with "Active" text
- **Disabled (0)**: Show gray badge with "Disabled" text

### 2. Profile Badges
- Use different colors for different profiles (admin, support, finance, etc.)
- Make it easy to identify user roles at a glance

### 3. Action Buttons
- Show "Resend Password Invitation" button only for users with `status === 2` (pending)
- Disable the button after sending and show a loading state
- Show success/error messages after sending

### 4. User Creation Flow
- After creating a user, show a success message indicating that email was sent automatically
- Don't require password input - let the system send the email automatically
- Optionally allow setting password directly if needed

### 5. Password Setting Page
- This is typically a public page (no auth required)
- User arrives via email link with token
- Form should include:
  - Password field
  - Confirm password field
  - Submit button
- After successful password set, redirect to login page

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users` | Create new user (email sent automatically if no password) | Yes |
| GET | `/api/users` | List users (filter by status) | Yes |
| GET | `/api/users/:id` | Get user details | Yes |
| PATCH | `/api/users/:id` | Update user | Yes |
| DELETE | `/api/users/:id` | Delete user | Yes |
| POST | `/api/users/:id/send-password-invitation` | Resend password invitation by user ID | Yes |
| POST | `/api/users/send-password-invitation-by-email` | Resend password invitation by email | Yes |
| POST | `/api/auth/set-password` | Set password using token | No |

## Status Flow Diagram

```
User Creation (No Password)
    ↓
Status: 2 (Pending)
    ↓
Email sent automatically with token link
    ↓
User clicks link → Set Password Page
    ↓
Password set successfully
    ↓
Status: 1 (Active)
    ↓
User can now login
```

```
User Creation (With Password)
    ↓
Status: 1 (Active)
    ↓
User can login immediately
```

## Key Differences from Students/Teachers

| Feature | Students/Teachers | Users |
|---------|------------------|-------|
| Email on Creation | ❌ Not sent automatically | ✅ Sent automatically |
| Manual Email Trigger | ✅ Required via button | ⚠️ Optional (resend only) |
| Status on Creation | 2 (Pending) | 2 (Pending) if no password, 1 (Active) if password provided |
| Password Required | ❌ No | ⚠️ Optional |

## Error Handling

### Common Errors

1. **400 Bad Request - "A user with email {email} already exists"**
   - Email is already in use
   - Show error to user
   - Suggest using a different email

2. **400 Bad Request - "A user with username {username} already exists"**
   - Username is already in use
   - Show error to user
   - Suggest using a different username

3. **400 Bad Request - "Company with ID {id} not found"**
   - Company doesn't exist
   - Usually shouldn't happen if using authenticated user's company

4. **400 Bad Request - "User already has a password set"**
   - User has already set their password
   - Status should be 1 (active)
   - Don't show "Resend Invitation" button

5. **400 Bad Request - "No password invitation token found"**
   - Token was not generated or was cleared
   - May need to regenerate token (handled automatically)

6. **400 Bad Request - "Token has expired"**
   - Token expired (24 hours)
   - System automatically regenerates token and sends email

## Validation Rules

- **Username**: Required, must be unique within company
- **Email**: Required, must be valid email format, must be unique within company
- **Profile**: Optional, must be one of: support, admin, finance, student, direction, prof, scholarity, teacher
- **Password**: Optional, if not provided, email will be sent automatically
- **Status**: Optional, defaults to 2 (pending) if no password, 1 (active) if password provided

## Testing Checklist

- [ ] Create a new user without password and verify status is 2 (pending)
- [ ] Verify email is sent automatically when creating user without password
- [ ] Create a new user with password and verify status is 1 (active)
- [ ] Verify no email is sent when password is provided
- [ ] Set password using token from email
- [ ] Verify user status changes to 1 (active) after setting password
- [ ] Verify user can log in after setting password
- [ ] Test error cases (duplicate email, duplicate username, expired token, etc.)
- [ ] Test UI displays correct status badges
- [ ] Test "Resend Invitation" button only shows for pending users
- [ ] Test user creation with different profiles

## Migration Notes

If you have existing users in the system:
- Existing users with passwords should have `status: 1` (active)
- Existing users without passwords should have `status: 2` (pending)
- You may want to add a migration script to update statuses based on password presence

## Support

For questions or issues, contact the backend team or refer to the API documentation at `/api/docs` (Swagger).
