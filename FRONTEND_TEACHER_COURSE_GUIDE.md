# Teacher Course API Guide

## Overview
The `teacher-course` resource manages the many-to-many relationship between teachers and courses. It's a simple junction table that tracks which teachers are assigned to teach which courses.

---

## 📋 **API Endpoints**

### **Base URL:** `/api/teacher-course`

All endpoints require JWT authentication (`Authorization: Bearer <token>`).

---

## 🔐 **Authentication**
All endpoints require:
- JWT token in the `Authorization` header
- User must belong to a company
- Users can only access teacher-course assignments for their company

---

## 📝 **Endpoints**

### **1. Create Teacher-Course Assignment**
**Endpoint:** `POST /api/teacher-course`

**Description:** Assigns a teacher to a course. If a soft-deleted assignment exists, it will be restored.

**Request Body:**
```typescript
{
  teacher_id: number;        // Required - Teacher identifier
  course_id: number;         // Required - Course identifier
  status?: number;           // Optional - Status (default: 1 = active)
}
```

**Status Values:**
- `0` = disabled
- `1` = active (default)
- `2` = pending
- `-1` = archived
- `-2` = deleted (soft delete)

**Example Request:**
```json
{
  "teacher_id": 5,
  "course_id": 16,
  "status": 1
}
```

**Success Response (201):**
```json
{
  "teacher_id": 5,
  "course_id": 16,
  "status": 1,
  "teacher": {
    "id": 5,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "company_id": 1
  },
  "course": {
    "id": 16,
    "title": "Mathematics",
    "description": "Advanced mathematics course",
    "company_id": 1
  },
  "created_at": "2026-01-29T10:00:00.000Z",
  "updated_at": "2026-01-29T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Teacher already assigned to this course (if not soft-deleted)
- `404 Not Found` - Teacher or course not found or doesn't belong to company
- `401 Unauthorized` - Missing or invalid JWT token

---

### **2. List Teacher-Course Assignments**
**Endpoint:** `GET /api/teacher-course`

**Description:** Retrieves paginated list of teacher-course assignments with optional filtering.

**Query Parameters:**
```typescript
{
  page?: number;           // Optional - Page number (default: 1)
  limit?: number;          // Optional - Items per page (default: 10)
  teacher_id?: number;     // Optional - Filter by teacher ID
  course_id?: number;      // Optional - Filter by course ID
  status?: number;         // Optional - Filter by status (-2 to 2)
}
```

**Example Request:**
```
GET /api/teacher-course?page=1&limit=20&teacher_id=5&status=1
```

**Success Response (200):**
```json
{
  "data": [
    {
      "teacher_id": 5,
      "course_id": 16,
      "status": 1,
      "teacher": {
        "id": 5,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "company_id": 1
      },
      "course": {
        "id": 16,
        "title": "Mathematics",
        "description": "Advanced mathematics course",
        "company_id": 1
      },
      "created_at": "2026-01-29T10:00:00.000Z",
      "updated_at": "2026-01-29T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Notes:**
- By default, soft-deleted records (status = -2) are excluded
- Results are ordered by `course_id` ASC, then `teacher_id` ASC
- Filtering by `status` will include soft-deleted records if explicitly requested

---

### **3. Get Single Teacher-Course Assignment**
**Endpoint:** `GET /api/teacher-course/:teacher_id/:course_id`

**Description:** Retrieves a specific teacher-course assignment.

**Path Parameters:**
- `teacher_id` (number, required) - Teacher identifier
- `course_id` (number, required) - Course identifier

**Example Request:**
```
GET /api/teacher-course/5/16
```

**Success Response (200):**
```json
{
  "teacher_id": 5,
  "course_id": 16,
  "status": 1,
  "teacher": {
    "id": 5,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "company_id": 1
  },
  "course": {
    "id": 16,
    "title": "Mathematics",
    "description": "Advanced mathematics course",
    "company_id": 1
  },
  "created_at": "2026-01-29T10:00:00.000Z",
  "updated_at": "2026-01-29T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Teacher-course assignment not found
- `401 Unauthorized` - Missing or invalid JWT token

---

### **4. Update Teacher-Course Assignment**
**Endpoint:** `PATCH /api/teacher-course/:teacher_id/:course_id`

**Description:** Updates the status of a teacher-course assignment.

**Path Parameters:**
- `teacher_id` (number, required) - Teacher identifier
- `course_id` (number, required) - Course identifier

**Request Body:**
```typescript
{
  status?: number;  // Optional - New status value
}
```

**Example Request:**
```json
PATCH /api/teacher-course/5/16
{
  "status": 0
}
```

**Success Response (200):**
```json
{
  "teacher_id": 5,
  "course_id": 16,
  "status": 0,
  "teacher": { ... },
  "course": { ... },
  "created_at": "2026-01-29T10:00:00.000Z",
  "updated_at": "2026-01-29T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Teacher-course assignment not found
- `400 Bad Request` - Invalid status value
- `401 Unauthorized` - Missing or invalid JWT token

---

### **5. Remove Teacher-Course Assignment**
**Endpoint:** `DELETE /api/teacher-course/:teacher_id/:course_id`

**Description:** Soft deletes a teacher-course assignment (sets status to -2).

**Path Parameters:**
- `teacher_id` (number, required) - Teacher identifier
- `course_id` (number, required) - Course identifier

**Example Request:**
```
DELETE /api/teacher-course/5/16
```

**Success Response (200):**
```json
{
  "message": "Teacher-course assignment removed successfully"
}
```

**Error Responses:**
- `404 Not Found` - Teacher-course assignment not found
- `401 Unauthorized` - Missing or invalid JWT token

**Note:** This is a soft delete. The assignment can be restored by creating it again (it will automatically restore if it was soft-deleted).

---

## 📊 **Data Models**

### **TeacherCourse Entity**
```typescript
interface TeacherCourse {
  teacher_id: number;           // Primary key (composite)
  course_id: number;            // Primary key (composite)
  status: number;               // Status: 0=disabled, 1=active, 2=pending, -1=archived, -2=deleted
  teacher: Teacher;             // Full teacher object
  course: Course;               // Full course object
  created_at: Date;             // Creation timestamp
  updated_at: Date;             // Last update timestamp
}
```

### **Teacher Object (nested)**
```typescript
interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  email2?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  city?: string;
  country?: string;
  codePostal: string;
  nationality?: string;
  picture?: string;
  status: number;
  company_id: number;
  created_at: Date;
  updated_at: Date;
}
```

### **Course Object (nested)**
```typescript
interface Course {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  pdf_file?: string;
  status: number;
  company_id: number;
  created_at: Date;
  updated_at: Date;
}
```

---

## 🎯 **Use Cases**

### **1. Assign Teacher to Course**
```typescript
// Assign teacher 5 to course 16
const response = await fetch('/api/teacher-course', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    teacher_id: 5,
    course_id: 16
  })
});
```

### **2. Get All Courses for a Teacher**
```typescript
// Get all courses assigned to teacher 5
const response = await fetch('/api/teacher-course?teacher_id=5', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();
// data contains array of TeacherCourse objects
```

### **3. Get All Teachers for a Course**
```typescript
// Get all teachers assigned to course 16
const response = await fetch('/api/teacher-course?course_id=16', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();
// data contains array of TeacherCourse objects
```

### **4. Check if Teacher is Assigned to Course**
```typescript
// Check if teacher 5 is assigned to course 16
try {
  const response = await fetch('/api/teacher-course/5/16', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (response.ok) {
    const assignment = await response.json();
    console.log('Teacher is assigned:', assignment);
  }
} catch (error) {
  if (error.status === 404) {
    console.log('Teacher is not assigned to this course');
  }
}
```

### **5. Remove Teacher from Course**
```typescript
// Remove teacher 5 from course 16
const response = await fetch('/api/teacher-course/5/16', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### **6. Update Assignment Status**
```typescript
// Disable teacher-course assignment
const response = await fetch('/api/teacher-course/5/16', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 0  // Disable
  })
});
```

---

## 🔍 **Filtering Examples**

### **Get Active Assignments Only**
```
GET /api/teacher-course?status=1
```

### **Get Assignments for Specific Teacher**
```
GET /api/teacher-course?teacher_id=5&status=1
```

### **Get Assignments for Specific Course**
```
GET /api/teacher-course?course_id=16&status=1
```

### **Get Disabled Assignments**
```
GET /api/teacher-course?status=0
```

### **Get All Assignments (Including Deleted)**
```
GET /api/teacher-course?status=-2
```

---

## ⚠️ **Important Notes**

1. **Composite Primary Key:** The table uses a composite primary key (`teacher_id` + `course_id`). You cannot have duplicate assignments for the same teacher-course combination.

2. **Soft Delete:** The `DELETE` endpoint performs a soft delete (sets status to -2). The record is not physically removed from the database.

3. **Auto-Restore:** If you try to create an assignment that was previously soft-deleted, it will automatically restore it instead of creating a duplicate.

4. **Company Isolation:** All queries are automatically filtered by the authenticated user's company. Users can only see and manage assignments for teachers and courses belonging to their company.

5. **Validation:** 
   - Both `teacher_id` and `course_id` must exist and belong to the company
   - Both teacher and course must not be soft-deleted (status ≠ -2)
   - Status must be between -2 and 2

6. **Ordering:** Results are ordered by `course_id` ASC, then `teacher_id` ASC.

---

## 🧪 **Testing Checklist**

- [ ] Create teacher-course assignment
- [ ] Create duplicate assignment (should fail)
- [ ] Create assignment with soft-deleted teacher (should fail)
- [ ] Create assignment with soft-deleted course (should fail)
- [ ] List all assignments
- [ ] Filter by teacher_id
- [ ] Filter by course_id
- [ ] Filter by status
- [ ] Get single assignment
- [ ] Update assignment status
- [ ] Soft delete assignment
- [ ] Restore soft-deleted assignment (create again)
- [ ] Verify company isolation (can't access other company's data)
- [ ] Test pagination
- [ ] Test error handling (404, 400, 401)

---

## 📱 **Frontend Implementation Examples**

### **React Hook Example**
```typescript
import { useState, useEffect } from 'react';

function useTeacherCourses(teacherId?: number, courseId?: number) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (teacherId) params.append('teacher_id', teacherId.toString());
        if (courseId) params.append('course_id', courseId.toString());
        
        const response = await fetch(`/api/teacher-course?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setAssignments(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [teacherId, courseId]);

  return { assignments, loading, error };
}
```

### **Vue Composable Example**
```typescript
import { ref, onMounted } from 'vue';

export function useTeacherCourses(teacherId?: number, courseId?: number) {
  const assignments = ref([]);
  const loading = ref(true);
  const error = ref(null);

  const fetchAssignments = async () => {
    try {
      loading.value = true;
      const params = new URLSearchParams();
      if (teacherId) params.append('teacher_id', teacherId.toString());
      if (courseId) params.append('course_id', courseId.toString());
      
      const response = await fetch(`/api/teacher-course?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      assignments.value = data.data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchAssignments);

  return { assignments, loading, error, refetch: fetchAssignments };
}
```

---

## 🔗 **Related Resources**

- **Teachers API:** `/api/teachers` - Manage teachers
- **Courses API:** `/api/courses` - Manage courses
- **Class Course API:** `/api/class-course` - Manage class-course assignments

---

**Last Updated:** January 29, 2026
**API Version:** 1.0
