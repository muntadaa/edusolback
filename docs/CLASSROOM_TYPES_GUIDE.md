# Classroom Types & Classrooms Relationship Guide

This document describes the relationship between Classroom Types and Classrooms, and how to use these APIs in the frontend.

## Overview

- **Classroom Types**: Categories or classifications for classrooms (e.g., "Lecture Hall", "Lab", "Computer Room", "Library")
- **Classrooms**: Physical rooms with a unique code, title, capacity, and an optional classroom type
- **Relationship**: A classroom can have one classroom type (optional), and a classroom type can be used by multiple classrooms

## Entity Relationship

```
ClassroomType (1) ──< (0..N) ClassRoom
```

- One ClassroomType can be assigned to many Classrooms
- One Classroom can have at most one ClassroomType (optional)
- ClassroomType is company-scoped (each company has its own types)

## Classroom Types API

### Base Path
`/api/classroom-types`

### Endpoints

#### 1. Create Classroom Type
**POST** `/api/classroom-types`

**Request Body:**
```json
{
  "title": "Lecture Hall",
  "status": 1
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Lecture Hall",
  "status": 1,
  "company_id": 2,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

**Notes:**
- `title` is required and must be unique per company
- `status` is optional (default: 1)
- `company_id` is automatically set from authenticated user

#### 2. List Classroom Types
**GET** `/api/classroom-types?page=1&limit=10&search=lecture&status=1`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by title
- `status` (optional): Filter by status (-2 to 2)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Lecture Hall",
      "status": 1,
      "company_id": 2,
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "lastPage": 1
  }
}
```

#### 3. Get Classroom Type by ID
**GET** `/api/classroom-types/:id`

**Response:**
```json
{
  "id": 1,
  "title": "Lecture Hall",
  "status": 1,
  "company_id": 2,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

#### 4. Update Classroom Type
**PATCH** `/api/classroom-types/:id`

**Request Body:**
```json
{
  "title": "Large Lecture Hall",
  "status": 1
}
```

**Notes:**
- All fields are optional (partial update)
- `company_id` cannot be changed

#### 5. Delete Classroom Type
**DELETE** `/api/classroom-types/:id`

**Notes:**
- Permanently deletes the classroom type
- Classrooms using this type will have their `classroom_type_id` set to `null` (if database supports it) or you should handle this in the frontend

---

## Classrooms API

### Base Path
`/api/class-rooms`

### Endpoints

#### 1. Create Classroom
**POST** `/api/class-rooms`

**Request Body:**
```json
{
  "code": "CR-101",
  "title": "Physics Lab",
  "classroom_type_id": 2,
  "capacity": 30,
  "status": 1
}
```

**Response:**
```json
{
  "id": 1,
  "code": "CR-101",
  "title": "Physics Lab",
  "classroom_type_id": 2,
  "classroomType": {
    "id": 2,
    "title": "Lab",
    "status": 1,
    "company_id": 2
  },
  "capacity": 30,
  "company_id": 2,
  "status": 1,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- `code` is required and must be unique across all classrooms
- `title` is required
- `capacity` is required and must be >= 0
- `classroom_type_id` is optional - if provided, must reference an existing classroom type that belongs to your company
- `status` is optional (default: 1)
- `company_id` is automatically set from authenticated user

**Error Responses:**
- `400 Bad Request`: If code already exists
  ```json
  {
    "statusCode": 400,
    "message": "A classroom with code 'CR-101' already exists."
  }
  ```
- `404 Not Found`: If classroom_type_id doesn't exist or doesn't belong to your company
  ```json
  {
    "statusCode": 404,
    "message": "Classroom type with ID 2 not found or does not belong to your company"
  }
  ```

#### 2. List Classrooms
**GET** `/api/class-rooms?page=1&limit=10&search=lab&classroom_type_id=2&status=1`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by code or title
- `classroom_type_id` (optional): Filter by classroom type
- `status` (optional): Filter by status (-2 to 2)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "code": "CR-101",
      "title": "Physics Lab",
      "classroom_type_id": 2,
      "classroomType": {
        "id": 2,
        "title": "Lab",
        "status": 1
      },
      "capacity": 30,
      "company_id": 2,
      "status": 1,
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "lastPage": 1
  }
}
```

**Notes:**
- The `classroomType` relation is automatically loaded in the response
- If a classroom has no type, `classroomType` will be `null`

#### 3. Get Classroom by ID
**GET** `/api/class-rooms/:id`

**Response:**
```json
{
  "id": 1,
  "code": "CR-101",
  "title": "Physics Lab",
  "classroom_type_id": 2,
  "classroomType": {
    "id": 2,
    "title": "Lab",
    "status": 1,
    "company_id": 2
  },
  "capacity": 30,
  "company_id": 2,
  "status": 1,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

#### 4. Update Classroom
**PATCH** `/api/class-rooms/:id`

**Request Body:**
```json
{
  "title": "Advanced Physics Lab",
  "classroom_type_id": 3,
  "capacity": 40
}
```

**Notes:**
- All fields are optional (partial update)
- `code` can be updated, but must remain unique
- `classroom_type_id` can be updated or set to `null` (by omitting it or setting to `null`)
- `company_id` cannot be changed

**Validation:**
- If updating `code`, it must not conflict with existing classrooms
- If updating `classroom_type_id`, the type must exist and belong to your company

#### 5. Delete Classroom
**DELETE** `/api/class-rooms/:id`

**Notes:**
- Permanently deletes the classroom

---

## Frontend Implementation Guide

### 1. Managing Classroom Types

#### Load Classroom Types for Dropdown
```typescript
// Load all active classroom types for a select dropdown
const loadClassroomTypes = async () => {
  try {
    const response = await fetch('/api/classroom-types?status=1&limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    return data.data; // Array of classroom types
  } catch (error) {
    console.error('Error loading classroom types:', error);
    return [];
  }
};
```

#### Create Classroom Type
```typescript
const createClassroomType = async (title: string) => {
  try {
    const response = await fetch('/api/classroom-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, status: 1 })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating classroom type:', error);
    throw error;
  }
};
```

### 2. Managing Classrooms

#### Create Classroom with Type
```typescript
const createClassroom = async (classroomData: {
  code: string;
  title: string;
  capacity: number;
  classroom_type_id?: number;
}) => {
  try {
    const response = await fetch('/api/class-rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(classroomData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating classroom:', error);
    throw error;
  }
};

// Example usage
await createClassroom({
  code: 'CR-101',
  title: 'Physics Lab',
  capacity: 30,
  classroom_type_id: 2 // Optional
});
```

#### Update Classroom Type
```typescript
const updateClassroomType = async (classroomId: number, classroomTypeId: number | null) => {
  try {
    const response = await fetch(`/api/class-rooms/${classroomId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        classroom_type_id: classroomTypeId // Can be null to remove type
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating classroom type:', error);
    throw error;
  }
};
```

### 3. UI Components Examples

#### Classroom Type Select Dropdown
```typescript
// React example
const ClassroomTypeSelect = ({ value, onChange, onAddNew }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassroomTypes().then(setTypes).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <select 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">No Type</option>
        {types.map(type => (
          <option key={type.id} value={type.id}>
            {type.title}
          </option>
        ))}
      </select>
      <button onClick={onAddNew}>Add New Type</button>
    </div>
  );
};
```

#### Classroom Form with Type Selection
```typescript
const ClassroomForm = ({ classroom, onSave }) => {
  const [formData, setFormData] = useState({
    code: classroom?.code || '',
    title: classroom?.title || '',
    capacity: classroom?.capacity || 0,
    classroom_type_id: classroom?.classroom_type_id || null,
  });
  const [types, setTypes] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadClassroomTypes().then(setTypes);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createClassroom(formData);
      onSave();
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        placeholder="Code (e.g., CR-101)"
        required
      />
      
      <input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Title"
        required
      />
      
      <select
        value={formData.classroom_type_id || ''}
        onChange={(e) => setFormData({ 
          ...formData, 
          classroom_type_id: e.target.value ? parseInt(e.target.value) : null 
        })}
      >
        <option value="">No Type</option>
        {types.map(type => (
          <option key={type.id} value={type.id}>
            {type.title}
          </option>
        ))}
      </select>
      
      <input
        type="number"
        value={formData.capacity}
        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
        placeholder="Capacity"
        min="0"
        required
      />
      
      <button type="submit">Save</button>
    </form>
  );
};
```

### 4. Filtering Classrooms by Type

```typescript
const filterClassroomsByType = async (typeId: number | null) => {
  try {
    const url = typeId 
      ? `/api/class-rooms?classroom_type_id=${typeId}`
      : '/api/class-rooms';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error filtering classrooms:', error);
    return [];
  }
};
```

### 5. Displaying Classroom with Type

```typescript
const ClassroomCard = ({ classroom }) => {
  return (
    <div className="classroom-card">
      <h3>{classroom.title}</h3>
      <p>Code: {classroom.code}</p>
      <p>Capacity: {classroom.capacity}</p>
      {classroom.classroomType ? (
        <span className="badge">{classroom.classroomType.title}</span>
      ) : (
        <span className="badge">No Type</span>
      )}
    </div>
  );
};
```

---

## Data Flow Diagram

```
┌─────────────────────┐
│  Classroom Types    │
│  (Settings/Admin)   │
└──────────┬──────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────┐
│    Classrooms       │
│  (CRUD Operations)  │
└─────────────────────┘
```

**Workflow:**
1. Admin creates classroom types in settings
2. When creating/editing a classroom, user selects from available types
3. Classroom can be filtered and displayed by type

---

## Best Practices

### 1. Pre-load Types
- Load classroom types when the classroom form/page loads
- Cache types to avoid repeated API calls
- Refresh types when a new type is created

### 2. Handle Null Types
- Always check if `classroomType` is `null` before accessing its properties
- Show "No Type" or similar placeholder when type is not assigned
- Allow users to remove type assignment (set to `null`)

### 3. Validation
- Validate `classroom_type_id` exists before submitting
- Show error if selected type doesn't exist
- Handle API errors gracefully (404 for non-existent types)

### 4. User Experience
- Show type badge/indicator on classroom cards
- Filter classrooms by type in lists
- Allow quick type assignment/change
- Provide "Add New Type" option in dropdown (opens modal/form)

### 5. Error Handling
```typescript
try {
  await createClassroom(data);
} catch (error) {
  if (error.message.includes('already exists')) {
    // Show error: "This code is already in use"
  } else if (error.message.includes('Classroom type')) {
    // Show error: "Selected type is invalid"
  } else {
    // Show generic error
  }
}
```

---

## API Response Examples

### Classroom with Type
```json
{
  "id": 1,
  "code": "CR-101",
  "title": "Physics Lab",
  "classroom_type_id": 2,
  "classroomType": {
    "id": 2,
    "title": "Lab",
    "status": 1,
    "company_id": 2,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  },
  "capacity": 30,
  "company_id": 2,
  "status": 1,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

### Classroom without Type
```json
{
  "id": 2,
  "code": "CR-102",
  "title": "General Purpose Room",
  "classroom_type_id": null,
  "classroomType": null,
  "capacity": 50,
  "company_id": 2,
  "status": 1,
  "created_at": "2025-01-15T11:00:00.000Z",
  "updated_at": "2025-01-15T11:00:00.000Z"
}
```

---

## Summary

- **Classroom Types** are managed separately and can be created/edited in settings
- **Classrooms** reference a classroom type via `classroom_type_id` (optional)
- The relationship is **optional** - classrooms can exist without a type
- Always load classroom types before showing the classroom form
- Handle `null` values for `classroomType` in your UI
- Filter and display classrooms by type for better organization

