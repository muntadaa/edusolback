# Planning Creation Validation Summary

## Overview
When creating planning entries directly from the frontend (via `POST /api/students-plannings`), the following validations are performed automatically.

---

## ✅ **Validations Performed**

### **1. Teacher Validation**
- ✅ Teacher must exist
- ✅ Teacher must belong to your company
- ✅ Teacher must not be soft-deleted (status ≠ -2)

**Error if invalid:**
```
Teacher with ID {id} not found or does not belong to your company
```

---

### **2. Course Validation**
- ✅ Course must exist
- ✅ Course must belong to your company
- ✅ Course must not be soft-deleted (status ≠ -2)

**Error if invalid:**
```
Course with ID {id} not found or does not belong to your company
```

---

### **3. Class Validation**
- ✅ Class must exist
- ✅ Class must belong to your company
- ✅ Class must not be soft-deleted (status ≠ -2)

**Error if invalid:**
```
Class with ID {id} not found or does not belong to your company
```

---

### **4. Class Room Validation**
- ✅ Class room must exist
- ✅ Class room must belong to your company
- ✅ Class room must not be soft-deleted (status ≠ -2)

**Error if invalid:**
```
Class room with ID {id} not found or does not belong to your company
```

---

### **5. Planning Session Type Validation**
- ✅ Planning session type must exist
- ✅ Planning session type must belong to your company

**Error if invalid:**
```
Planning session type with ID {id} not found or does not belong to your company
```

---

### **6. School Year Validation** (if provided)
- ✅ School year must exist
- ✅ School year must not be soft-deleted
- ✅ School year must belong to your company

**Error if invalid:**
```
School year with ID {id} not found
```
or
```
School year does not belong to your company
```

---

### **7. Time Range Validation**
- ✅ Start time must be before end time
- ✅ Times must be in HH:MM format (24-hour)

**Error if invalid:**
```
End time must be after start time
```

---

### **8. Duplicate Prevention**
Checks for **exact duplicates** - same:
- Date (`date_day`)
- Start time (`hour_start`)
- End time (`hour_end`)
- Class (`class_id`)
- Teacher (`teacher_id`)
- Course (`course_id`)
- Classroom (`class_room_id`)

**Error if duplicate:**
```
An identical planning already exists with the same date, time, class, teacher, course, and classroom.
```

---

### **9. Overlap Prevention**
Checks for **time conflicts** with existing plannings on the same date:
- Same teacher at overlapping time
- Same class at overlapping time
- Same classroom at overlapping time

**Error if overlap:**
```
Planning overlaps with an existing entry (same teacher, class, or classroom at overlapping time).
```

---

## 📋 **What You Need to Provide**

When creating planning entries from your form, you need to send:

```typescript
{
  period: string;                    // Required - e.g., "Semester 1 - January 2026"
  teacher_id: number;                // Required - Must be assigned to course via teacher-course
  course_id: number;                  // Required - From class-course
  class_id: number;                   // Required - Must belong to same level as class-course
  class_room_id: number;              // Required
  planning_session_type_id: number;   // Required
  date_day: string;                   // Required - YYYY-MM-DD format
  hour_start: string;                 // Required - HH:MM format (15-min increments)
  hour_end: string;                   // Required - HH:MM format (15-min increments)
  school_year_id?: number;            // Optional
  status?: number;                    // Optional (default: 2 = pending)
}
```

---

## ⚠️ **Important Notes**

1. **Teacher-Course Assignment:** The teacher must be assigned to the course via the `teacher-course` table. However, **this is NOT validated** in the planning creation endpoint. You should validate this on the frontend or handle the error gracefully.

2. **Class Level Matching:** Classes should belong to the same level as the class-course, but **this is NOT validated** in the planning endpoint. Validate this on the frontend.

3. **Bulk Creation:** If you're creating multiple planning entries (for multiple dates/classes), you'll need to:
   - Loop through dates and classes on the frontend
   - Call `POST /api/students-plannings` for each entry
   - Handle errors for duplicates/overlaps (you can skip them or show errors)

4. **Error Handling:** 
   - Duplicate/overlap errors will stop the creation
   - You can catch these errors and continue with other entries
   - Or show them to the user to decide what to do

---

## 🎯 **Frontend Implementation Strategy**

### **Option 1: Create One by One**
```typescript
// Generate dates for selected days
const dates = generateDates(startDate, endDate, daysOfWeek);

// Create planning for each class × each date
for (const classId of selectedClassIds) {
  for (const date of dates) {
    try {
      await fetch('/api/students-plannings', {
        method: 'POST',
        body: JSON.stringify({
          period: formData.period,
          teacher_id: formData.teacher_id,
          course_id: classCourse.course_id,
          class_id: classId,
          class_room_id: formData.class_room_id,
          planning_session_type_id: formData.planning_session_type_id,
          date_day: formatDate(date),
          hour_start: formData.hour_start,
          hour_end: formData.hour_end || calculateEndTime(formData.hour_start),
          school_year_id: formData.school_year_id,
        })
      });
    } catch (error) {
      // Handle duplicate/overlap errors
      // Continue with next entry or show error
    }
  }
}
```

### **Option 2: Use Existing Duplicate Endpoint**
The planning service already has a `POST /api/students-plannings/duplicate` endpoint that handles bulk creation with duplicate/overlap skipping. You could potentially use this, but it requires a source planning to duplicate from.

---

## ✅ **Validation Checklist for Frontend**

Before sending to the API, validate:

- [ ] Teacher is assigned to course (check teacher-course table)
- [ ] Classes belong to same level as class-course
- [ ] All IDs exist and belong to company
- [ ] Date range is valid (start ≤ end)
- [ ] At least one date matches selected days of week
- [ ] Time range is valid (start < end)
- [ ] End time is calculated if not provided (start + 15min)

---

## 📝 **Summary**

**You can create planning entries directly from the frontend** using `POST /api/students-plannings`. The backend will validate:
- All entities exist and belong to company
- No exact duplicates
- No time overlaps

**You should validate on frontend:**
- Teacher-course assignment
- Class level matching
- Date generation logic
- Time calculations

The validations are robust and will prevent invalid data from being created. You just need to handle the errors gracefully when duplicates/overlaps occur.
