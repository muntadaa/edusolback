# School Years & Periods Validation Guide

This document describes the validation rules for School Years and School Year Periods that must be enforced on the frontend.

## Overview

The API enforces the following business rules:
1. **At most one ongoing school year** can exist (max: 1, min: 0 allowed for initial setup)
   - **Recommended**: 1 ongoing school year should exist
   - **Warning**: Frontend should show a warning if 0 ongoing years exist
2. **At most one ongoing period per school year** can exist (max: 1, min: 0 allowed for initial setup)
   - **Recommended**: 1 ongoing period per school year should exist
   - **Warning**: Frontend should show a warning if 0 ongoing periods exist for a school year

## School Years Validation

### Rule: At Most One Ongoing Year

- **Minimum**: 0 ongoing school years allowed (for initial setup)
- **Maximum**: 1 ongoing school year can exist
- **Recommended**: 1 ongoing school year should exist
- **Field**: `lifecycle_status` must be `'ongoing'`
- **Frontend Warning**: Show a warning if 0 ongoing years exist

### API Behavior

#### Creating a School Year

**Endpoint**: `POST /api/school-years`

**Request Body**:
```json
{
  "title": "2025-2026",
  "start_date": "2025-09-01",
  "end_date": "2026-06-30",
  "status": 1,
  "lifecycle_status": "ongoing"
}
```

**Validation Rules**:
- If `lifecycle_status` is set to `'ongoing'` and another school year already has `lifecycle_status: 'ongoing'`, the API will return:
  - **Status Code**: `400 Bad Request`
  - **Error Message**: `"There must be at most one ongoing school year. Another school year is already ongoing."`
- **Note**: Creating a school year with `lifecycle_status` other than `'ongoing'` is always allowed, even if no ongoing years exist. The frontend should check and show a warning.

#### Updating a School Year

**Endpoint**: `PATCH /api/school-years/:id`

**Scenarios**:

1. **Setting a year to ongoing when another is already ongoing**:
   - If you try to change a year's `lifecycle_status` to `'ongoing'` and another year is already ongoing, you'll get:
     - **Status Code**: `400 Bad Request`
     - **Error Message**: `"There must be at most one ongoing school year. Another school year is already ongoing."`

2. **Changing an ongoing year to another status**:
   - **Allowed**: You can change an ongoing year to `'planned'` or `'completed'` even if it's the only ongoing year
   - **Frontend Warning**: After changing the only ongoing year to another status, check if any ongoing years exist and show a warning if none are found

### Frontend Implementation Guide

#### Before Creating/Updating

1. **Check for existing ongoing year**:
   ```typescript
   // Before setting a year to 'ongoing'
   const ongoingYears = await fetch('/api/school-years?lifecycle_status=ongoing');
   const data = await ongoingYears.json();
   
   if (data.data.length > 0 && data.data[0].id !== currentYearId) {
     // Show error: Another year is already ongoing
     // Prevent the action or ask user to change the other year first
   }
   ```

2. **Check if any ongoing years exist (for warnings)**:
   ```typescript
   // Check if there are any ongoing years (to show warning if none)
   const ongoingYears = await fetch('/api/school-years?lifecycle_status=ongoing');
   const data = await ongoingYears.json();
   
   if (data.data.length === 0) {
     // Show warning: "No ongoing school year found. It is recommended to have one ongoing school year."
   }
   ```

3. **Before changing ongoing year to another status**:
   ```typescript
   // Before changing from 'ongoing' to another status
   const ongoingYears = await fetch('/api/school-years?lifecycle_status=ongoing');
   const data = await ongoingYears.json();
   
   if (data.data.length === 1 && data.data[0].id === currentYearId) {
     // Show warning: "This is the only ongoing school year. After changing it, there will be no ongoing years."
     // Allow the action, but show the warning
   }
   ```

#### Error Handling

Always handle the API error responses:

```typescript
try {
  const response = await fetch('/api/school-years', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Display error.message to the user
    if (error.message.includes('ongoing school year')) {
      // Show specific UI for this validation error
    }
  }
} catch (error) {
  // Handle network errors
}
```

#### UI Recommendations

1. **Lifecycle Status Dropdown**:
   - When user selects `'ongoing'`, check if another year is already ongoing
   - Show a warning message if conflict exists
   - Disable submit button until conflict is resolved

2. **Status Change Warning**:
   - When changing the only ongoing year, show a warning (not blocking):
     ```
     "Warning: This is the only ongoing school year. After this change, 
     there will be no ongoing school years. It is recommended to have 
     one ongoing school year."
     ```
   - Allow the user to proceed, but show the warning clearly

3. **Visual Indicators**:
   - Highlight the ongoing year in the list
   - Show a badge/indicator for the ongoing year
   - Show a warning banner/alert if no ongoing years exist: "Warning: No ongoing school year found. It is recommended to set one school year to 'ongoing'."

---

## School Year Periods Validation

### Rule: At Most One Ongoing Period Per School Year

- **Minimum**: 0 ongoing periods per school year allowed (for initial setup)
- **Maximum**: 1 ongoing period per school year can exist
- **Recommended**: 1 ongoing period per school year should exist
- **Scope**: Validation is per school year (each school year can have its own ongoing period)
- **Frontend Warning**: Show a warning if 0 ongoing periods exist for a school year

### API Behavior

#### Creating a School Year Period

**Endpoint**: `POST /api/school-year-periods`

**Request Body**:
```json
{
  "schoolYearId": 1,
  "title": "Semester 1",
  "start_date": "2025-09-01",
  "end_date": "2025-12-20",
  "status": 1,
  "lifecycle_status": "ongoing"
}
```

**Validation Rules**:
- If `lifecycle_status` is set to `'ongoing'` and another period in the same school year already has `lifecycle_status: 'ongoing'`, the API will return:
  - **Status Code**: `400 Bad Request`
  - **Error Message**: `"There must be at most one ongoing period per school year. Another period in this school year is already ongoing."`
- **Note**: Creating a period with `lifecycle_status` other than `'ongoing'` is always allowed, even if no ongoing periods exist for that school year. The frontend should check and show a warning.

#### Updating a School Year Period

**Endpoint**: `PATCH /api/school-year-periods/:id`

**Scenarios**:

1. **Setting a period to ongoing when another in the same year is already ongoing**:
   - If you try to change a period's `lifecycle_status` to `'ongoing'` and another period in the same school year is already ongoing, you'll get:
     - **Status Code**: `400 Bad Request`
     - **Error Message**: `"There must be at most one ongoing period per school year. Another period in this school year is already ongoing."`

2. **Changing an ongoing period to another status**:
   - **Allowed**: You can change an ongoing period to `'planned'` or `'completed'` even if it's the only ongoing period in that school year
   - **Frontend Warning**: After changing the only ongoing period in a school year to another status, check if any ongoing periods exist for that school year and show a warning if none are found

### Frontend Implementation Guide

#### Before Creating/Updating

1. **Check for existing ongoing period in the same school year**:
   ```typescript
   // Before setting a period to 'ongoing'
   const ongoingPeriods = await fetch(
     `/api/school-year-periods?school_year_id=${schoolYearId}&lifecycle_status=ongoing`
   );
   const data = await ongoingPeriods.json();
   
   if (data.data.length > 0 && data.data[0].id !== currentPeriodId) {
     // Show error: Another period in this school year is already ongoing
     // Prevent the action or ask user to change the other period first
   }
   ```

2. **Check if any ongoing periods exist for a school year (for warnings)**:
   ```typescript
   // Check if there are any ongoing periods for a school year (to show warning if none)
   const ongoingPeriods = await fetch(
     `/api/school-year-periods?school_year_id=${schoolYearId}&lifecycle_status=ongoing`
   );
   const data = await ongoingPeriods.json();
   
   if (data.data.length === 0) {
     // Show warning: "No ongoing period found for this school year. It is recommended to have one ongoing period."
   }
   ```

3. **Before changing ongoing period to another status**:
   ```typescript
   // Before changing from 'ongoing' to another status
   const ongoingPeriods = await fetch(
     `/api/school-year-periods?school_year_id=${schoolYearId}&lifecycle_status=ongoing`
   );
   const data = await ongoingPeriods.json();
   
   if (data.data.length === 1 && data.data[0].id === currentPeriodId) {
     // Show warning: "This is the only ongoing period in this school year. After changing it, there will be no ongoing periods for this school year."
     // Allow the action, but show the warning
   }
   ```

#### Error Handling

Always handle the API error responses:

```typescript
try {
  const response = await fetch('/api/school-year-periods', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Display error.message to the user
    if (error.message.includes('ongoing period')) {
      // Show specific UI for this validation error
    }
  }
} catch (error) {
  // Handle network errors
}
```

#### UI Recommendations

1. **Lifecycle Status Dropdown**:
   - When user selects `'ongoing'`, check if another period in the same school year is already ongoing
   - Show a warning message if conflict exists
   - Disable submit button until conflict is resolved

2. **Status Change Warning**:
   - When changing the only ongoing period in a school year, show a warning (not blocking):
     ```
     "Warning: This is the only ongoing period in this school year. 
     After this change, there will be no ongoing periods for this school year. 
     It is recommended to have one ongoing period per school year."
     ```
   - Allow the user to proceed, but show the warning clearly

3. **Visual Indicators**:
   - Highlight the ongoing period in the list (grouped by school year)
   - Show a badge/indicator for the ongoing period
   - Disable changing the only ongoing period's status without first setting another in the same school year to ongoing

4. **School Year Context**:
   - Always show which school year a period belongs to
   - Filter periods by school year when checking for conflicts
   - Group periods by school year in the UI
   - Show a warning for each school year that has no ongoing periods: "Warning: School Year [name] has no ongoing period. It is recommended to set one period to 'ongoing'."

---

## Summary of Error Messages

| Scenario | Error Message |
|----------|--------------|
| Creating/updating school year to ongoing when another exists | `"There must be at most one ongoing school year. Another school year is already ongoing."` |
| Creating/updating period to ongoing when another in same year exists | `"There must be at most one ongoing period per school year. Another period in this school year is already ongoing."` |

**Note**: Changing the only ongoing year/period to another status is **allowed**. The frontend should check and show a warning if no ongoing items exist after the change.

## Best Practices for Frontend Implementation

1. **Proactive Validation**: Check for conflicts before submitting forms
2. **User Feedback**: Show clear error messages and warnings
3. **Prevent Invalid Actions**: Disable buttons/options that would violate rules
4. **Confirmation Dialogs**: Ask for confirmation when changing the only ongoing item
5. **Real-time Updates**: Refresh data after status changes to show current state
6. **Visual Indicators**: Clearly mark ongoing items in lists
7. **Context Awareness**: Always consider the school year context for periods

## Testing Checklist

- [ ] Cannot create a second ongoing school year
- [ ] Can change the only ongoing school year to another status (allowed, but show warning)
- [ ] Cannot create a second ongoing period in the same school year
- [ ] Can change the only ongoing period in a school year to another status (allowed, but show warning)
- [ ] Warning is shown when no ongoing school years exist
- [ ] Warning is shown when no ongoing periods exist for a school year
- [ ] Warning is shown before changing the only ongoing year/period
- [ ] Error messages are displayed clearly to users
- [ ] UI prevents invalid actions (creating second ongoing) before API calls
- [ ] UI shows warnings (not blocking) for recommended states

