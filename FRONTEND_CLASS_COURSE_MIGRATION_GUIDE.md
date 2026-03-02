# Class Course API Migration Guide

## Overview
The `class-course` resource has been completely refactored. This guide outlines all changes that affect the frontend.

---

## 🗑️ **Removed Features**

### 1. **Batch Creation Endpoint**
- **Endpoint Removed:** `POST /api/class-course/batch`
- **DTO Removed:** `CreateBatchClassCourseDto`
- **Impact:** You can no longer create multiple class courses in a single request. Each class course must be created individually.

### 2. **Class Relationship**
- **Field Removed:** `class_id` (from entity, DTOs, and queries)
- **Impact:** Class courses are no longer directly linked to classes. They are now linked to levels instead.

### 3. **Teacher Relationship**
- **Field Removed:** `teacher_id` (from entity, DTOs, and queries)
- **Impact:** Class courses no longer have a direct teacher assignment.

---

## ✨ **New Features**

### 1. **Level Relationship**
- **Field Added:** `level_id` (required)
- **Type:** `number`
- **Description:** Links the class course to a level instead of a class
- **Validation:** Must be a valid level ID that belongs to the company

---

## 🔄 **Changed Features**

### 1. **Duration Field**
- **Previous:** Required field (default: 2)
- **Current:** Optional field (nullable)
- **Impact:** You can now create class courses without specifying a duration

---

## 📋 **API Changes**

### **Create Class Course**
**Endpoint:** `POST /api/class-course`

**Request Body (CreateClassCourseDto):**
```typescript
{
  title: string;                    // Required
  description?: string;              // Optional
  status?: number;                   // Optional (-2 to 2, default: 1)
  level_id: number;                  // ✅ NEW - Required (replaces class_id)
  module_id: number;                 // Required (unchanged)
  course_id: number;                 // Required (unchanged)
  volume?: number;                   // Optional (unchanged)
  weeklyFrequency?: number;          // Optional (unchanged, default: 1)
  allday?: boolean;                  // Optional (unchanged, default: false)
  duration?: number;                 // ✅ CHANGED - Now optional (was required)
}
```

**Changes:**
- ❌ Removed: `class_id`
- ❌ Removed: `teacher_id`
- ✅ Added: `level_id` (required)
- ✅ Changed: `duration` is now optional

---

### **Update Class Course**
**Endpoint:** `PATCH /api/class-course/:id`

**Request Body (UpdateClassCourseDto):**
- Same structure as CreateClassCourseDto, but all fields are optional
- Can update `level_id` to change the level association
- Cannot update `class_id` or `teacher_id` (they no longer exist)

---

### **Get All Class Courses**
**Endpoint:** `GET /api/class-course`

**Query Parameters (ClassCourseQueryDto):**
```typescript
{
  page?: number;                     // Optional (default: 1)
  limit?: number;                    // Optional (default: 10)
  search?: string;                    // Optional - Search by title or description
  status?: number;                    // Optional (-2 to 2)
  level_id?: number;                 // ✅ CHANGED - Now direct filter (was through class)
  module_id?: number;                // Optional (unchanged)
  course_id?: number;                // Optional (unchanged)
  allday?: boolean;                  // Optional (unchanged)
}
```

**Removed Query Parameters:**
- ❌ `class_id` - No longer available
- ❌ `teacher_id` - No longer available
- ❌ `program_id` - No longer available (was filtered through class)
- ❌ `specialization_id` - No longer available (was filtered through class)

**Response Structure:**
```typescript
{
  data: ClassCourse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

**ClassCourse Response Object:**
```typescript
{
  id: number;
  title: string;
  description?: string;
  status: number;
  company_id: number;
  level_id: number;                  // ✅ NEW (replaces class_id)
  level: {                            // ✅ NEW - Level object with nested relations
    id: number;
    title: string;
    description?: string;
    specialization: {
      id: number;
      title: string;
      program: {
        id: number;
        title: string;
      }
    }
  };
  module_id: number;
  module: Module;                     // Unchanged
  course_id: number;
  course: Course;                     // Unchanged
  volume?: number;
  weeklyFrequency: number;
  allday: boolean;
  duration?: number;                  // ✅ CHANGED - Now nullable
  created_at: Date;
  updated_at: Date;
}
```

**Removed from Response:**
- ❌ `class_id`
- ❌ `class` object
- ❌ `teacher_id`
- ❌ `teacher` object

---

### **Get Single Class Course**
**Endpoint:** `GET /api/class-course/:id`

**Response:** Same structure as in the list response above.

---

## 🔍 **Filtering Changes**

### **Before (Old Structure):**
```typescript
// Filter by class
GET /api/class-course?class_id=5

// Filter by teacher
GET /api/class-course?teacher_id=10

// Filter by program (through class)
GET /api/class-course?program_id=2

// Filter by specialization (through class)
GET /api/class-course?specialization_id=3

// Filter by level (through class)
GET /api/class-course?level_id=4
```

### **After (New Structure):**
```typescript
// Filter by level (direct)
GET /api/class-course?level_id=4

// Other filters remain the same
GET /api/class-course?module_id=5
GET /api/class-course?course_id=10
GET /api/class-course?allday=true
```

---

## 📊 **Data Migration Considerations**

### **If You Have Existing Class Courses:**

1. **Old Data Structure:**
   - Class courses were linked to classes via `class_id`
   - Each class course had a `teacher_id`

2. **New Data Structure:**
   - Class courses are linked to levels via `level_id`
   - No teacher relationship

3. **Migration Path:**
   - You'll need to map existing `class_id` values to their corresponding `level_id` values
   - The relationship: `Class` → `level_id` → `Level`
   - You can query classes to get their `level_id`:
     ```typescript
     GET /api/class/:id
     // Response includes: class.level.id
     ```

---

## 🎯 **Frontend Action Items**

### **1. Update Create/Edit Forms**

**Before:**
```typescript
const formData = {
  title: "Math Course",
  class_id: 5,           // ❌ Remove
  teacher_id: 10,        // ❌ Remove
  module_id: 3,
  course_id: 7,
  duration: 2,           // Was required
  // ...
};
```

**After:**
```typescript
const formData = {
  title: "Math Course",
  level_id: 4,           // ✅ Add - Get from class.level.id
  module_id: 3,
  course_id: 7,
  duration: 2,           // ✅ Now optional
  // ...
};
```

### **2. Update List/Table Components**

**Remove columns:**
- Class name (from `class.title`)
- Teacher name (from `teacher.first_name` / `teacher.last_name`)

**Add columns:**
- Level name (from `level.title`)
- Program name (from `level.specialization.program.title`)
- Specialization name (from `level.specialization.title`)

**Example:**
```typescript
// Old
<td>{classCourse.class?.title}</td>
<td>{classCourse.teacher?.first_name} {classCourse.teacher?.last_name}</td>

// New
<td>{classCourse.level?.title}</td>
<td>{classCourse.level?.specialization?.program?.title}</td>
<td>{classCourse.level?.specialization?.title}</td>
```

### **3. Update Filters**

**Remove filter options:**
- Class filter dropdown
- Teacher filter dropdown
- Program filter (was through class)
- Specialization filter (was through class)

**Update filter:**
- Level filter (now direct, not through class)

**Example:**
```typescript
// Old filter component
<Select name="class_id" ... />
<Select name="teacher_id" ... />
<Select name="program_id" ... />
<Select name="specialization_id" ... />
<Select name="level_id" ... />

// New filter component
<Select name="level_id" ... />  // Direct level filter
<Select name="module_id" ... />
<Select name="course_id" ... />
```

### **4. Update Batch Creation Logic**

**Before:**
```typescript
// Batch create for multiple classes
POST /api/class-course/batch
{
  classIds: ["1", "2", "3"],
  moduleId: 5,
  courseId: 10,
  teacherId: 7,
  // ...
}
```

**After:**
```typescript
// Create individually for each level
const levels = [1, 2, 3];
for (const levelId of levels) {
  await fetch('/api/class-course', {
    method: 'POST',
    body: JSON.stringify({
      level_id: levelId,
      module_id: 5,
      course_id: 10,
      // ...
    })
  });
}
```

### **5. Update TypeScript Types**

```typescript
// Old interface
interface ClassCourse {
  id: number;
  class_id: number;
  class?: ClassEntity;
  teacher_id: number;
  teacher?: Teacher;
  duration: number;
  // ...
}

// New interface
interface ClassCourse {
  id: number;
  level_id: number;
  level?: {
    id: number;
    title: string;
    specialization?: {
      id: number;
      title: string;
      program?: {
        id: number;
        title: string;
      };
    };
  };
  duration?: number;  // Now optional
  // ...
}
```

---

## ⚠️ **Breaking Changes Summary**

1. ❌ **Batch creation endpoint removed** - Must create individually
2. ❌ **`class_id` removed** - Use `level_id` instead
3. ❌ **`teacher_id` removed** - No longer tracked
4. ❌ **`class` relation removed** - Use `level` relation instead
5. ❌ **`teacher` relation removed** - No longer available
6. ❌ **Query filters removed:** `class_id`, `teacher_id`, `program_id`, `specialization_id`
7. ✅ **`level_id` added** - Required for creation
8. ✅ **`level` relation added** - Includes nested specialization and program
9. ✅ **`duration` is now optional** - Can be null/undefined

---

## 🧪 **Testing Checklist**

- [ ] Create class course with `level_id` (required)
- [ ] Create class course without `duration` (should work)
- [ ] Update class course `level_id`
- [ ] Filter by `level_id` in list endpoint
- [ ] Verify `level` object includes nested `specialization` and `program`
- [ ] Remove any batch creation UI/logic
- [ ] Remove class and teacher columns from tables
- [ ] Add level, program, and specialization columns
- [ ] Update all TypeScript interfaces
- [ ] Test error handling for invalid `level_id`

---

## 📞 **Support**

If you encounter any issues during migration, please check:
1. All `class_id` references are replaced with `level_id`
2. All `teacher_id` references are removed
3. Batch creation logic is replaced with individual creation
4. Filter components are updated
5. TypeScript types are updated

---

**Last Updated:** January 29, 2026
**API Version:** Updated to reflect ClassCourse refactoring
