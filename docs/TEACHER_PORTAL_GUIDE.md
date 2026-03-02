# Teacher Portal Frontend Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing the teacher portal interface. Teachers can manage their classes, track student attendance, assign grades, share homework, and send links to students.

---

## Table of Contents

1. [Teacher Account Creation & Activation](#teacher-account-creation--activation)
2. [Teacher Authentication Flow](#teacher-authentication-flow)
3. [Teacher Dashboard - Viewing Plannings](#teacher-dashboard---viewing-plannings)
4. [Managing Student Absence](#managing-student-absence)
5. [Giving Notes/Grades to Students](#giving-notesgrades-to-students)
6. [Sending Links to Students](#sending-links-to-students)
7. [Giving Homework to Students](#giving-homework-to-students)
8. [Status Values Reference](#status-values-reference)
9. [Error Handling](#error-handling)
10. [UI/UX Recommendations](#uiux-recommendations)

---

## Teacher Account Creation & Activation

### Backend Behavior

When an admin creates a new teacher:

1. **Teacher Record Created**: Status defaults to `2` (pending)
2. **User Account Created**: 
   - Profile: `'teacher'`
   - Status: `2` (pending)
   - Password: `null` (not set yet)
   - Username: Auto-generated from first name and last name
   - Password token: Generated but email is NOT sent automatically
3. **Password Invitation Email**: Email is NOT sent automatically. The frontend must trigger it via a button/endpoint
4. **Activation**: Teacher becomes active (status `1`) only after setting their password

### Frontend Implementation

#### Step 1: Admin Creates Teacher

```typescript
// POST /api/teachers
// Headers: Authorization: Bearer <admin_token>
// Content-Type: multipart/form-data

const formData = new FormData();
formData.append('first_name', 'John');
formData.append('last_name', 'Doe');
formData.append('email', 'john.doe@school.com');
formData.append('phone', '+1234567890');
// ... other fields
// Optional: formData.append('picture', file);

const response = await fetch('/api/teachers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
  },
  body: formData,
});

// Response: Teacher object with status: 2 (pending)
```

#### Step 2: Admin Sends Password Invitation Email (via Button)

After creating the teacher, the admin should trigger the password invitation email via a button:

```typescript
// POST /api/teachers/:id/send-password-invitation
// Headers: Authorization: Bearer <admin_token>

const response = await fetch(`/api/teachers/${teacherId}/send-password-invitation`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
  },
});

// Response: { message: 'Password invitation email sent successfully' }
```

**UI Example:**
```tsx
const TeacherList = () => {
  const sendPasswordInvitation = async (teacherId: number) => {
    try {
      const response = await fetch(`/api/teachers/${teacherId}/send-password-invitation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      alert(data.message || 'Password invitation sent!');
    } catch (error) {
      alert('Failed to send invitation email');
    }
  };

  return (
    <table>
      {teachers.map(teacher => (
        <tr key={teacher.id}>
          <td>{teacher.first_name} {teacher.last_name}</td>
          <td>{teacher.email}</td>
          <td>
            {teacher.status === 2 && (
              <button onClick={() => sendPasswordInvitation(teacher.id)}>
                Send Password Invitation
              </button>
            )}
          </td>
        </tr>
      ))}
    </table>
  );
};
```

#### Step 3: Teacher Receives Email

The teacher receives an email with a link to set their password. The link format is:
```
https://your-frontend.com/set-password?token=<password_set_token>
```

#### Step 4: Teacher Sets Password

```typescript
// POST /api/auth/set-password
const response = await fetch('/api/auth/set-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: tokenFromUrl, // Extract from query parameter
    password: 'securePassword123',
    confirmPassword: 'securePassword123',
  }),
});

// Response: { message: 'Password has been set successfully. You can now login.' }
// Backend automatically sets teacher status to 1 (active)
```

---

## Teacher Authentication Flow

### Login

```typescript
// POST /api/auth/login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.doe@school.com',
    password: 'securePassword123',
  }),
});

// Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "email": "john.doe@school.com",
    "username": "john.doe",
    "profile": "teacher",
    "company_id": 1,
    "allowedRoutes": ["/dashboard", "/plannings", ...],
    "company": {
      "id": 1,
      "name": "School Name",
      "email": "school@example.com"
    }
  }
}
```

### Token Usage

Store the token and include it in all subsequent requests:

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};
```

---

## Teacher Dashboard - Viewing Plannings

### Get Teacher's Plannings

Teachers can view all their scheduled classes/sessions:

```typescript
// GET /api/students-plannings?teacher_id=<teacher_id>&page=1&limit=20
// Note: You can get teacher_id from the logged-in user's token payload or by fetching teacher profile

// Option 1: Get teacher ID from user profile
const teacher = await fetch('/api/teachers?email=' + userEmail, {
  headers: { 'Authorization': `Bearer ${token}` },
});

// Option 2: Filter plannings by teacher_id (if you have it)
const plannings = await fetch('/api/students-plannings?teacher_id=5&page=1&limit=50', {
  headers: { 'Authorization': `Bearer ${token}` },
});

// Response:
{
  "data": [
    {
      "id": 12,
      "period": "Semester 1",
      "date_day": "2025-01-15",
      "hour_start": "09:00",
      "hour_end": "11:00",
      "teacher": {
        "id": 5,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.com"
      },
      "course": {
        "id": 3,
        "title": "Mathematics"
      },
      "class": {
        "id": 2,
        "title": "Class A"
      },
      "classRoom": {
        "id": 1,
        "name": "Room 101"
      },
      "planningSessionType": {
        "id": 1,
        "title": "Lecture"
      },
      "schoolYear": {
        "id": 1,
        "title": "2024-2025"
      }
    },
    // ... more plannings
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

### Filtering Options

You can filter plannings by:
- `class_id`: Filter by class
- `course_id`: Filter by course
- `school_year_id`: Filter by school year
- `date_day`: Filter by date (if supported)
- `order`: `ASC` or `DESC` (default: `ASC`)

### UI Example

```tsx
// React example
const TeacherPlannings = () => {
  const [plannings, setPlannings] = useState([]);
  const [loading, setLoading] = useState(true);
  const teacherId = useTeacherId(); // Get from context/auth

  useEffect(() => {
    fetch(`/api/students-plannings?teacher_id=${teacherId}&order=ASC`)
      .then(res => res.json())
      .then(data => {
        setPlannings(data.data);
        setLoading(false);
      });
  }, [teacherId]);

  return (
    <div>
      <h2>My Schedule</h2>
      {plannings.map(planning => (
        <div key={planning.id} className="planning-card">
          <h3>{planning.course.title}</h3>
          <p>Class: {planning.class.title}</p>
          <p>Room: {planning.classRoom.name}</p>
          <p>Date: {planning.date_day}</p>
          <p>Time: {planning.hour_start} - {planning.hour_end}</p>
          <button onClick={() => manageSession(planning.id)}>
            Manage Session
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## Managing Student Absence

### Get Students for a Planning Session

To manage absence, you need to get the list of students enrolled in the class for that planning session:

```typescript
// GET /api/class-student?class_id=<class_id>&status=1
// This returns all active students in the class

const classStudents = await fetch(`/api/class-student?class_id=${classId}&status=1`, {
  headers: { 'Authorization': `Bearer ${token}` },
});

// Response:
{
  "data": [
    {
      "id": 1,
      "student": {
        "id": 10,
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice@example.com"
      },
      "class": {
        "id": 2,
        "title": "Class A"
      }
    },
    // ... more students
  ]
}
```

### Create/Update Student Presence

```typescript
// POST /api/student-presence
// Create a new presence record for a student in a planning session

const presence = await fetch('/api/student-presence', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    student_id: 10,
    student_planning_id: 12, // The planning session ID
    presence: 'present', // Options: 'present', 'absent', 'late', 'excused'
    note: -1, // -1 means no note assigned yet
    remarks: 'Optional remarks',
    status: 2, // Default status
  }),
});

// Response: StudentPresence object
```

### Update Presence

```typescript
// PATCH /api/student-presence/:id
const updatePresence = await fetch(`/api/student-presence/${presenceId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    presence: 'absent', // Change to absent
    remarks: 'Student was sick',
  }),
});
```

### Get Existing Presences for a Planning Session

```typescript
// GET /api/student-presence?student_planning_id=<planning_id>
const presences = await fetch(`/api/student-presence?student_planning_id=${planningId}`, {
  headers: { 'Authorization': `Bearer ${token}` },
});

// Response: Array of presence records
```

### UI Example - Attendance Management

```tsx
const AttendanceManager = ({ planningId, classId }) => {
  const [students, setStudents] = useState([]);
  const [presences, setPresences] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch students in the class
    fetch(`/api/class-student?class_id=${classId}&status=1`)
      .then(res => res.json())
      .then(data => {
        setStudents(data.data);
        // Fetch existing presences
        return fetch(`/api/student-presence?student_planning_id=${planningId}`);
      })
      .then(res => res.json())
      .then(data => {
        const presenceMap = {};
        data.data.forEach(p => {
          presenceMap[p.student_id] = p;
        });
        setPresences(presenceMap);
        setLoading(false);
      });
  }, [planningId, classId]);

  const updatePresence = async (studentId, presenceValue) => {
    const existing = presences[studentId];
    if (existing) {
      // Update existing
      await fetch(`/api/student-presence/${existing.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ presence: presenceValue }),
      });
    } else {
      // Create new
      await fetch('/api/student-presence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          student_planning_id: planningId,
          presence: presenceValue,
          note: -1,
          status: 2,
        }),
      });
    }
    // Refresh presences
    // ... reload data
  };

  return (
    <div>
      <h3>Attendance for Session</h3>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(cs => {
            const presence = presences[cs.student_id];
            return (
              <tr key={cs.student_id}>
                <td>{cs.student.first_name} {cs.student.last_name}</td>
                <td>{presence?.presence || 'Not marked'}</td>
                <td>
                  <select
                    value={presence?.presence || ''}
                    onChange={(e) => updatePresence(cs.student_id, e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Giving Notes/Grades to Students

### Option 1: Through Student Presence

You can assign grades directly in the presence record:

```typescript
// PATCH /api/student-presence/:id
const updateGrade = await fetch(`/api/student-presence/${presenceId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    note: 18.5, // Grade out of 20 (or your grading system)
    remarks: 'Excellent work!',
  }),
});
```

### Option 2: Through Student Report Details

For more detailed grading, you can use student report details:

```typescript
// First, get or create a student report
// GET /api/student-report?student_id=<student_id>&class_id=<class_id>&school_year_id=<year_id>

// Then, create a report detail with note
// POST /api/student-report-detail
const reportDetail = await fetch('/api/student-report-detail', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    student_report_id: reportId,
    teacher_id: teacherId, // Your teacher ID
    course_id: courseId,
    note: 18.5,
    remarks: 'Very good performance in the exam',
    status: 2,
  }),
});
```

### UI Example - Grade Assignment

```tsx
const GradeManager = ({ studentId, planningId, courseId }) => {
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');

  const submitGrade = async () => {
    // Option 1: Update presence with grade
    await fetch(`/api/student-presence/${presenceId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        note: parseFloat(grade),
        remarks: remarks,
      }),
    });
    
    alert('Grade assigned successfully!');
  };

  return (
    <div>
      <h3>Assign Grade</h3>
      <input
        type="number"
        step="0.5"
        min="0"
        max="20"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        placeholder="Grade (0-20)"
      />
      <textarea
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Remarks (optional)"
      />
      <button onClick={submitGrade}>Submit Grade</button>
    </div>
  );
};
```

---

## Sending Links to Students

### Create a Student Link

Teachers can send links (resources, documents, videos, etc.) to students:

```typescript
// POST /api/student-link-type
const link = await fetch('/api/student-link-type', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    student_id: 10,
    link: 'https://example.com/resource',
    title: 'Math Homework Resources',
    description: 'Useful links for this week\'s homework',
    status: 2, // Default status
  }),
});

// Response: StudentLinkType object
```

### Get Links for a Student

```typescript
// GET /api/student-link-type?student_id=<student_id>
const links = await fetch(`/api/student-link-type?student_id=${studentId}`, {
  headers: { 'Authorization': `Bearer ${token}` },
});

// Response: Array of links
```

### UI Example - Link Sharing

```tsx
const LinkSharer = ({ studentId }) => {
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const shareLink = async () => {
    await fetch('/api/student-link-type', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        link: link,
        title: title,
        description: description,
        status: 2,
      }),
    });
    
    alert('Link shared successfully!');
    // Reset form
    setLink('');
    setTitle('');
    setDescription('');
  };

  return (
    <div>
      <h3>Share Link with Student</h3>
      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://example.com"
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Link Title"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
      />
      <button onClick={shareLink}>Share Link</button>
    </div>
  );
};
```

---

## Giving Homework to Students

### Option 1: Using Student Reports

You can add homework information in student report details:

```typescript
// POST /api/student-report-detail
const homework = await fetch('/api/student-report-detail', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    student_report_id: reportId,
    teacher_id: teacherId,
    course_id: courseId,
    remarks: 'Homework: Complete exercises 1-10 on page 45. Due date: 2025-01-20',
    status: 2,
  }),
});
```

### Option 2: Using Student Links

You can share homework documents/links:

```typescript
// POST /api/student-link-type
const homeworkLink = await fetch('/api/student-link-type', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    student_id: studentId,
    link: 'https://example.com/homework-assignment.pdf',
    title: 'Math Homework - Week 3',
    description: 'Complete all exercises. Submit by Friday.',
    status: 2,
  }),
});
```

### UI Example - Homework Assignment

```tsx
const HomeworkAssigner = ({ studentId, courseId }) => {
  const [homework, setHomework] = useState('');
  const [dueDate, setDueDate] = useState('');

  const assignHomework = async () => {
    // Option 1: As a link
    await fetch('/api/student-link-type', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        link: homework, // URL to homework document
        title: `Homework - ${new Date().toLocaleDateString()}`,
        description: `Due date: ${dueDate}`,
        status: 2,
      }),
    });
    
    alert('Homework assigned!');
  };

  return (
    <div>
      <h3>Assign Homework</h3>
      <input
        type="url"
        value={homework}
        onChange={(e) => setHomework(e.target.value)}
        placeholder="Homework document URL"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        placeholder="Due Date"
      />
      <button onClick={assignHomework}>Assign Homework</button>
    </div>
  );
};
```

---

## Status Values Reference

### Teacher Status
- `-2`: Deleted (soft delete)
- `1`: Active
- `2`: Pending (default when created, becomes active after password is set)

### User Status
- `-2`: Deleted (soft delete)
- `1`: Active
- `2`: Pending (default when created, becomes active after password is set)

### Presence Status Values
- `'present'`: Student is present
- `'absent'`: Student is absent
- `'late'`: Student arrived late
- `'excused'`: Student is excused

### Note Values
- `-1`: No note assigned yet
- `0-20` (or your grading scale): Actual grade

---

## Error Handling

### Common Error Responses

```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "A teacher with email example@email.com already exists",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Teacher not found",
  "error": "Not Found"
}
```

### Frontend Error Handling Example

```typescript
const handleApiCall = async (apiCall: Promise<Response>) => {
  try {
    const response = await apiCall;
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Show user-friendly error message
    alert(error.message || 'Something went wrong. Please try again.');
    throw error;
  }
};
```

---

## UI/UX Recommendations

### 1. Teacher Dashboard Layout

```
┌─────────────────────────────────────────┐
│  Teacher Dashboard                      │
├─────────────────────────────────────────┤
│  [Upcoming Sessions] [Today's Classes]   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Today's Schedule                  │ │
│  │ 09:00 - 11:00 | Math | Class A   │ │
│  │ 14:00 - 16:00 | Science | Class B│ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Quick Actions]                        │
│  - Mark Attendance                     │
│  - Assign Grades                       │
│  - Share Resources                     │
└─────────────────────────────────────────┘
```

### 2. Session Management Interface

- **Calendar View**: Show plannings in a calendar format
- **List View**: Show plannings as a list with filters
- **Quick Actions**: One-click access to mark attendance, assign grades

### 3. Attendance Management

- **Bulk Actions**: Mark multiple students at once
- **Visual Indicators**: Color-code presence status (green=present, red=absent)
- **Search/Filter**: Quickly find a student in large classes

### 4. Grade Assignment

- **Grade Scale Display**: Show the grading scale (e.g., 0-20)
- **Grade History**: Show previous grades for the student
- **Validation**: Ensure grades are within valid range

### 5. Link Sharing

- **Link Preview**: Show preview of shared links
- **Categories**: Organize links by course or topic
- **Bulk Share**: Share the same link to multiple students

### 6. Responsive Design

- Ensure all interfaces work on mobile devices
- Teachers should be able to mark attendance on tablets/phones

---

## Testing Checklist

- [ ] Teacher can receive and use password invitation email
- [ ] Teacher can login after setting password
- [ ] Teacher can view their plannings/schedule
- [ ] Teacher can filter plannings by date, class, course
- [ ] Teacher can mark student attendance (present/absent/late/excused)
- [ ] Teacher can assign grades to students
- [ ] Teacher can share links with students
- [ ] Teacher can assign homework (via links or reports)
- [ ] All actions require proper authentication
- [ ] Error messages are user-friendly
- [ ] UI is responsive and works on mobile devices

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/teachers` | POST | Create teacher (admin only) |
| `/api/teachers/:id/send-password-invitation` | POST | Send password invitation email (admin only) |
| `/api/auth/set-password` | POST | Set password with token |
| `/api/auth/login` | POST | Teacher login |
| `/api/students-plannings` | GET | Get plannings (filter by `teacher_id`) |
| `/api/class-student` | GET | Get students in a class |
| `/api/student-presence` | POST/PATCH | Create/update attendance |
| `/api/student-presence` | GET | Get attendance records |
| `/api/student-report-detail` | POST | Create report detail with grade |
| `/api/student-link-type` | POST | Share link with student |
| `/api/student-link-type` | GET | Get links for a student |

---

## Support

For questions or issues, contact the backend development team or refer to the API documentation at `/api/docs` (Swagger).

