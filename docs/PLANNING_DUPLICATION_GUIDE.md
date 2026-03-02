# Planning Duplication & Recurrence Frontend Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing planning duplication and recurrence features in the frontend. The backend supports three types of duplication: week-based (for all-day courses), frequency-based (placeholders), and recurring (weekly repetition).

---

## Table of Contents

1. [Understanding the Features](#understanding-the-features)
2. [Backend API Endpoint](#backend-api-endpoint)
3. [Frontend Implementation Guide](#frontend-implementation-guide)
4. [AI Prompt for Frontend Development](#ai-prompt-for-frontend-development)
5. [UI/UX Recommendations](#uiux-recommendations)
6. [Error Handling](#error-handling)
7. [Testing Checklist](#testing-checklist)

---

## Understanding the Features

### 1. Week Duplication (All-Day Courses)
- **When to use**: Course has `allday: true` in ClassCourse
- **What it does**: Duplicates the planning for Monday-Saturday (6 days) for X weeks
- **User input**: Number of weeks (e.g., 3 weeks = 18 planning records)
- **Result**: All plannings have the same time, different dates (Mon-Sat for each week)

### 2. Frequency-Based Duplication
- **When to use**: Course has a `weeklyFrequency` number (e.g., 3 times per week)
- **What it does**: Creates N placeholder plannings (N = weeklyFrequency)
- **User input**: None (automatic based on course frequency)
- **Result**: Placeholder plannings with same date/time as source (frontend must update)

### 3. Recurring Planning (Weekly Repetition)
- **When to use**: User wants same day/time repeated for X months
- **What it does**: Creates plannings for the same day of week, same time, for X months
- **User input**: Duration in months (e.g., 3 months, 10 months)
- **Result**: Multiple plannings (e.g., every Monday for 3 months = ~12-13 records)

---

## Backend API Endpoint

### Endpoint: `POST /api/students-plannings/duplicate`

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```typescript
{
  source_planning_id: number;        // Required: ID of planning to duplicate
  type: 'week' | 'frequency' | 'recurring';  // Required: Duplication type
  number_of_weeks?: number;          // Required for 'week' type (1-52)
  duration_months?: number;          // Required for 'recurring' type (1-24)
}
```

**Response**:
```typescript
{
  message: string;                   // e.g., "18 planning(s) created successfully"
  created_count: number;             // Number of plannings created
  plannings: StudentsPlanning[];     // Array of created planning objects
}
```

**Error Responses**:
- `400 Bad Request`: Invalid parameters, course not all-day for week type, etc.
- `404 Not Found`: Source planning or ClassCourse not found
- `401 Unauthorized`: Missing or invalid token

---

## Frontend Implementation Guide

### Step 1: Get Course Information

Before showing duplication options, fetch the ClassCourse to check `allday` and `weeklyFrequency`:

```typescript
// GET /api/class-course?class_id=X&course_id=Y&teacher_id=Z
const classCourse = await fetch(
  `/api/class-course?class_id=${classId}&course_id=${courseId}&teacher_id=${teacherId}`,
  {
    headers: { 'Authorization': `Bearer ${token}` },
  }
).then(res => res.json());

// Check classCourse.allday and classCourse.weeklyFrequency
```

### Step 2: Show Duplication Options

Based on the course type, show appropriate options:

```tsx
// React example
const PlanningDuplicationModal = ({ planning, classCourse, onClose }) => {
  const [duplicationType, setDuplicationType] = useState<string>('');
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(1);
  const [durationMonths, setDurationMonths] = useState<number>(3);

  const handleDuplicate = async () => {
    const payload: any = {
      source_planning_id: planning.id,
      type: duplicationType,
    };

    if (duplicationType === 'week') {
      payload.number_of_weeks = numberOfWeeks;
    } else if (duplicationType === 'recurring') {
      payload.duration_months = durationMonths;
    }

    const response = await fetch('/api/students-plannings/duplicate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    alert(`Created ${result.created_count} planning(s)`);
    onClose();
  };

  return (
    <div className="modal">
      <h3>Duplicate Planning</h3>
      
      {/* Week Duplication (only if allday) */}
      {classCourse.allday && (
        <div>
          <label>
            <input
              type="radio"
              value="week"
              checked={duplicationType === 'week'}
              onChange={(e) => setDuplicationType(e.target.value)}
            />
            Duplicate for entire week (Mon-Sat)
          </label>
          {duplicationType === 'week' && (
            <div>
              <label>Number of weeks:</label>
              <input
                type="number"
                min="1"
                max="52"
                value={numberOfWeeks}
                onChange={(e) => setNumberOfWeeks(parseInt(e.target.value))}
              />
              <p>Will create {numberOfWeeks * 6} planning(s)</p>
            </div>
          )}
        </div>
      )}

      {/* Frequency-Based (always available) */}
      <div>
        <label>
          <input
            type="radio"
            value="frequency"
            checked={duplicationType === 'frequency'}
            onChange={(e) => setDuplicationType(e.target.value)}
          />
          Create {classCourse.weeklyFrequency || 1} placeholder(s) based on frequency
        </label>
        {duplicationType === 'frequency' && (
          <p>You will need to update date and time for each placeholder after creation.</p>
        )}
      </div>

      {/* Recurring (always available) */}
      <div>
        <label>
          <input
            type="radio"
            value="recurring"
            checked={duplicationType === 'recurring'}
            onChange={(e) => setDuplicationType(e.target.value)}
          />
          Repeat weekly for X months
        </label>
        {duplicationType === 'recurring' && (
          <div>
            <label>Duration (months):</label>
            <input
              type="number"
              min="1"
              max="24"
              value={durationMonths}
              onChange={(e) => setDurationMonths(parseInt(e.target.value))}
            />
            <p>Will create plannings for same day/time for {durationMonths} month(s)</p>
          </div>
        )}
      </div>

      <button onClick={handleDuplicate} disabled={!duplicationType}>
        Duplicate
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};
```

### Step 3: Handle Frequency Placeholders

After creating frequency-based duplications, show a form to update each placeholder:

```tsx
const FrequencyPlaceholderEditor = ({ placeholders, onSave }) => {
  const [updates, setUpdates] = useState<Record<number, { date_day: string; hour_start: string; hour_end: string }>>({});

  const handleUpdate = async (placeholderId: number) => {
    const update = updates[placeholderId];
    if (!update) return;

    await fetch(`/api/students-plannings/${placeholderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });

    alert('Planning updated!');
  };

  return (
    <div>
      <h3>Update Frequency Placeholders</h3>
      {placeholders.map(placeholder => (
        <div key={placeholder.id}>
          <h4>Placeholder {placeholder.id}</h4>
          <input
            type="date"
            value={updates[placeholder.id]?.date_day || placeholder.date_day}
            onChange={(e) => setUpdates({
              ...updates,
              [placeholder.id]: {
                ...updates[placeholder.id],
                date_day: e.target.value,
                hour_start: updates[placeholder.id]?.hour_start || placeholder.hour_start,
                hour_end: updates[placeholder.id]?.hour_end || placeholder.hour_end,
              },
            })}
          />
          <input
            type="time"
            value={updates[placeholder.id]?.hour_start || placeholder.hour_start}
            onChange={(e) => setUpdates({
              ...updates,
              [placeholder.id]: {
                ...updates[placeholder.id],
                date_day: updates[placeholder.id]?.date_day || placeholder.date_day,
                hour_start: e.target.value,
                hour_end: updates[placeholder.id]?.hour_end || placeholder.hour_end,
              },
            })}
          />
          <input
            type="time"
            value={updates[placeholder.id]?.hour_end || placeholder.hour_end}
            onChange={(e) => setUpdates({
              ...updates,
              [placeholder.id]: {
                ...updates[placeholder.id],
                date_day: updates[placeholder.id]?.date_day || placeholder.date_day,
                hour_start: updates[placeholder.id]?.hour_start || placeholder.hour_start,
                hour_end: e.target.value,
              },
            })}
          />
          <button onClick={() => handleUpdate(placeholder.id)}>Update</button>
        </div>
      ))}
    </div>
  );
};
```

---

## AI Prompt for Frontend Development

Copy and paste this prompt to your frontend AI assistant:

```
I need to implement planning duplication and recurrence features for a school management system. Here are the requirements:

**Context:**
- Users can create individual planning sessions (classes/sessions) for students
- Each planning has: date, start time, end time, teacher, course, class, classroom
- Courses have a ClassCourse relationship with properties:
  - `allday: boolean` - indicates if course is daily (all week)
  - `weeklyFrequency: number` - how many times per week (e.g., 3)

**Features to Implement:**

1. **Week Duplication (for all-day courses)**
   - Show option only if `classCourse.allday === true`
   - User inputs: number of weeks (1-52)
   - Creates 6 plannings per week (Monday-Saturday, no Sunday)
   - All plannings have same time, different dates
   - Example: 3 weeks = 18 plannings

2. **Frequency-Based Duplication**
   - Always available
   - Creates N placeholder plannings (N = `classCourse.weeklyFrequency`)
   - Placeholders have same date/time as source
   - After creation, show a form to update each placeholder's date and time
   - User must fill in different days/times for each placeholder

3. **Recurring Planning**
   - Always available
   - User inputs: duration in months (1-24)
   - Creates plannings for same day of week, same time, for X months
   - Example: Monday 9:00-11:00 for 3 months = ~12-13 Monday plannings

**API Endpoint:**
POST /api/students-plannings/duplicate
Headers: Authorization: Bearer <token>
Body: {
  source_planning_id: number,
  type: 'week' | 'frequency' | 'recurring',
  number_of_weeks?: number,      // Required for 'week'
  duration_months?: number        // Required for 'recurring'
}

Response: {
  message: string,
  created_count: number,
  plannings: Planning[]
}

**UI Requirements:**
1. Add a "Duplicate" button next to each planning in the list
2. Show a modal with three radio button options (based on course type)
3. For week type: show number input (1-52 weeks) with preview count
4. For frequency type: show info that placeholders will be created
5. For recurring type: show number input (1-24 months) with preview
6. After frequency duplication: show a table/form to update each placeholder
7. All created plannings should appear in the planning list
8. Each planning is independent (can be edited/deleted individually)

**Technical Requirements:**
- Use TypeScript
- Handle loading states
- Show error messages for API failures
- Validate inputs (weeks: 1-52, months: 1-24)
- Refresh planning list after successful duplication
- For frequency placeholders: allow bulk update or individual update

**Error Handling:**
- 400: Show specific error message
- 404: "Planning or course not found"
- 401: Redirect to login
- Network errors: Show retry option

Please implement this feature with a clean, user-friendly interface. Use React/TypeScript with proper state management and error handling.
```

---

## UI/UX Recommendations

### 1. Planning List View
```
┌─────────────────────────────────────────────────────────┐
│ Planning List                                            │
├─────────────────────────────────────────────────────────┤
│ [Date] [Time] [Course] [Class] [Teacher] [Actions]     │
│ 2025-01-15 09:00-11:00 Math Class A  John Doe [Edit] [Duplicate] │
│ 2025-01-16 14:00-16:00 Science Class B Jane Smith [Edit] [Duplicate] │
└─────────────────────────────────────────────────────────┘
```

### 2. Duplication Modal
```
┌──────────────────────────────────────┐
│ Duplicate Planning                   │
├──────────────────────────────────────┤
│ ○ Duplicate for entire week (Mon-Sat)│
│   Number of weeks: [3] weeks         │
│   Will create: 18 planning(s)        │
│                                      │
│ ○ Create frequency placeholders      │
│   Will create: 3 placeholder(s)    │
│   (You'll update date/time after)    │
│                                      │
│ ○ Repeat weekly for X months         │
│   Duration: [3] months                │
│   Will create: ~12 planning(s)      │
│                                      │
│        [Cancel]  [Duplicate]         │
└──────────────────────────────────────┘
```

### 3. Frequency Placeholder Editor
```
┌─────────────────────────────────────────────────────┐
│ Update Frequency Placeholders                        │
├─────────────────────────────────────────────────────┤
│ Placeholder #123                                     │
│ Date: [2025-01-20] Time: [09:00] - [11:00] [Update]│
│                                                      │
│ Placeholder #124                                     │
│ Date: [2025-01-22] Time: [14:00] - [16:00] [Update]│
│                                                      │
│ Placeholder #125                                     │
│ Date: [2025-01-24] Time: [09:00] - [11:00] [Update]│
│                                                      │
│              [Save All]  [Cancel]                   │
└─────────────────────────────────────────────────────┘
```

### 4. Visual Indicators
- Show a badge/icon on duplicated plannings (e.g., "Duplicated")
- Use different colors for different duplication types
- Show loading spinner during duplication
- Show success toast with count: "18 plannings created successfully"

---

## Error Handling

### Common Errors and Solutions

```typescript
const handleDuplicate = async (payload) => {
  try {
    const response = await fetch('/api/students-plannings/duplicate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 400) {
        // Bad request - show specific error
        alert(error.message || 'Invalid parameters');
      } else if (response.status === 404) {
        alert('Planning or course not found');
      } else if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      } else {
        alert('An error occurred. Please try again.');
      }
      return;
    }

    const result = await response.json();
    showSuccessToast(`${result.created_count} planning(s) created successfully`);
    refreshPlanningList();
    
  } catch (error) {
    console.error('Duplication error:', error);
    alert('Network error. Please check your connection and try again.');
  }
};
```

---

## Testing Checklist

- [ ] Week duplication works for all-day courses
- [ ] Week duplication shows correct count preview (weeks × 6)
- [ ] Week duplication creates correct number of plannings
- [ ] Week duplication only available for all-day courses
- [ ] Frequency duplication creates correct number of placeholders
- [ ] Frequency placeholders can be updated individually
- [ ] Recurring duplication creates plannings for correct duration
- [ ] Recurring plannings are on same day of week
- [ ] All created plannings appear in planning list
- [ ] Each planning can be edited/deleted independently
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] Input validation works (weeks: 1-52, months: 1-24)
- [ ] Modal closes after successful duplication
- [ ] Planning list refreshes after duplication

---

## API Examples

### Example 1: Week Duplication
```typescript
POST /api/students-plannings/duplicate
{
  "source_planning_id": 12,
  "type": "week",
  "number_of_weeks": 3
}

Response:
{
  "message": "18 planning(s) created successfully",
  "created_count": 18,
  "plannings": [...]
}
```

### Example 2: Frequency Duplication
```typescript
POST /api/students-plannings/duplicate
{
  "source_planning_id": 12,
  "type": "frequency"
}

Response:
{
  "message": "3 planning(s) created successfully",
  "created_count": 3,
  "plannings": [
    { "id": 123, "date_day": "2025-01-15", ... },
    { "id": 124, "date_day": "2025-01-15", ... },
    { "id": 125, "date_day": "2025-01-15", ... }
  ]
}
```

### Example 3: Recurring Duplication
```typescript
POST /api/students-plannings/duplicate
{
  "source_planning_id": 12,
  "type": "recurring",
  "duration_months": 3
}

Response:
{
  "message": "12 planning(s) created successfully",
  "created_count": 12,
  "plannings": [...]
}
```

---

## Support

For questions or issues, refer to the API documentation at `/api/docs` (Swagger) or contact the backend development team.

