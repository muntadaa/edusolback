# Student Password Flow Guide

## Overview

This guide explains the new student creation and password management flow. Students are now created with a **pending** status and must set their password to become **active**. Password invitation emails are sent only when explicitly triggered by the frontend.

## Status Values

- **2 (Pending)**: Student/user is created but hasn't set their password yet
- **1 (Active)**: Student/user has set their password and can log in
- **0 (Disabled)**: Student/user is disabled
- **-1 (Archived)**: Student/user is archived
- **-2 (Deleted)**: Student/user is soft-deleted

## Student Creation Flow

### 1. Create Student

**Endpoint:** `POST /api/students`

**Request:**
- Content-Type: `multipart/form-data`
- Headers: `Authorization: Bearer <token>`

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "gender": "male",
  "birthday": "2010-05-15",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "nationality": "American",
  "picture": "<file>", // optional
  "status": 2 // optional, defaults to 2 (pending)
}
```

**Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "status": 2, // pending
  "company_id": 1,
  "created_at": "2026-01-05T10:00:00.000Z",
  "updated_at": "2026-01-05T10:00:00.000Z",
  "company": {
    "id": 1,
    "name": "Example School"
  }
}
```

**Important Notes:**
- Student is created with `status: 2` (pending) by default
- A corresponding user account is automatically created with `status: 2` (pending)
- **NO email is sent automatically** during student creation
- The user account has no password set initially

### 2. Send Password Invitation Email

**Endpoint:** `POST /api/students/:id/send-password-invitation`

**Request:**
- Headers: `Authorization: Bearer <token>`

**Example:**
```bash
POST /api/students/1/send-password-invitation
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Password invitation email sent successfully"
}
```

**When to Use:**
- Call this endpoint when the user clicks a "Send Password Invitation" button in the UI
- This should be triggered manually, not automatically after student creation
- The email contains a link to set the password

**Error Cases:**
- `400 Bad Request`: User already has a password set
- `400 Bad Request`: No password invitation token found
- `400 Bad Request`: Token has expired (regenerates token automatically)

### 3. Student Sets Password

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
- **Student status changes from 2 (pending) to 1 (active)**
- Password set token is cleared
- Student can now log in

## Frontend Implementation Guide

### Student Creation Form

```typescript
// Example: Create student form
const createStudent = async (formData: FormData) => {
  try {
    const response = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData // includes student data and optional picture
    });
    
    const student = await response.json();
    
    // Show success message
    // Optionally show a button to send password invitation
    showSuccessMessage('Student created successfully. Status: Pending');
    
    return student;
  } catch (error) {
    // Handle error
  }
};
```

### Student List with Status Display

```typescript
// Example: Display students with status badges
const StudentList = ({ students }) => {
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

  return (
    <Table>
      {students.map(student => (
        <TableRow key={student.id}>
          <td>{student.first_name} {student.last_name}</td>
          <td>{student.email}</td>
          <td>{getStatusBadge(student.status)}</td>
          <td>
            {student.status === 2 && (
              <Button onClick={() => sendPasswordInvitation(student.id)}>
                Send Password Invitation
              </Button>
            )}
          </td>
        </TableRow>
      ))}
    </Table>
  );
};
```

### Send Password Invitation Button

```typescript
// Example: Send password invitation
const sendPasswordInvitation = async (studentId: number) => {
  try {
    const response = await fetch(`/api/students/${studentId}/send-password-invitation`, {
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

### Student Detail View

```typescript
// Example: Student detail page with status and actions
const StudentDetail = ({ studentId }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    const response = await fetch(`/api/students/${studentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setStudent(data);
    setLoading(false);
  };

  const handleSendInvitation = async () => {
    await sendPasswordInvitation(studentId);
    // Optionally refresh student data to show updated status
    await fetchStudent();
  };

  if (loading) return <Spinner />;

  return (
    <Card>
      <CardHeader>
        <h2>{student.first_name} {student.last_name}</h2>
        <StatusBadge status={student.status} />
      </CardHeader>
      <CardBody>
        <p>Email: {student.email}</p>
        <p>Status: {getStatusText(student.status)}</p>
        
        {student.status === 2 && (
          <Button 
            onClick={handleSendInvitation}
            variant="primary"
          >
            Send Password Invitation Email
          </Button>
        )}
        
        {student.status === 1 && (
          <Badge color="success">
            Student has set password and is active
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

### 2. Action Buttons
- Show "Send Password Invitation" button only for students with `status === 2` (pending)
- Disable the button after sending and show a loading state
- Show success/error messages after sending

### 3. Student List Filters
- Add filter by status (Pending, Active, Disabled)
- Show count of students by status

### 4. Student Creation Flow
- After creating a student, show a success message
- Optionally show a button to immediately send password invitation
- Don't automatically send the email - let the user decide

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
| POST | `/api/students` | Create new student (status: pending) | Yes |
| POST | `/api/students/:id/send-password-invitation` | Send password invitation email | Yes |
| GET | `/api/students` | List students (filter by status) | Yes |
| GET | `/api/students/:id` | Get student details | Yes |
| POST | `/api/auth/set-password` | Set password using token | No |

## Status Flow Diagram

```
Student Creation
    ↓
Status: 2 (Pending)
    ↓
[Frontend triggers] Send Password Invitation
    ↓
Email sent with token link
    ↓
Student clicks link → Set Password Page
    ↓
Password set successfully
    ↓
Status: 1 (Active) [Both User & Student]
    ↓
Student can now login
```

## Error Handling

### Common Errors

1. **400 Bad Request - "User already has a password set"**
   - Student has already set their password
   - Status should be 1 (active)
   - Don't show "Send Invitation" button

2. **400 Bad Request - "No password invitation token found"**
   - Token was not generated or was cleared
   - May need to regenerate token (handled automatically)

3. **400 Bad Request - "Token has expired"**
   - Token expired (24 hours)
   - System automatically regenerates token and sends email

4. **400 Bad Request - "Duplicate entry: email already exists"**
   - Email is already in use
   - Show error to user

## Testing Checklist

- [ ] Create a new student and verify status is 2 (pending)
- [ ] Verify no email is sent automatically
- [ ] Send password invitation and verify email is received
- [ ] Set password using token from email
- [ ] Verify both user and student status change to 1 (active)
- [ ] Verify student can log in after setting password
- [ ] Test error cases (duplicate email, expired token, etc.)
- [ ] Test UI displays correct status badges
- [ ] Test "Send Invitation" button only shows for pending students

## Migration Notes

If you have existing students in the system:
- Existing students with passwords should have `status: 1` (active)
- Existing students without passwords should have `status: 2` (pending)
- You may want to add a migration script to update statuses based on password presence

## Support

For questions or issues, contact the backend team or refer to the API documentation at `/api/docs` (Swagger).


