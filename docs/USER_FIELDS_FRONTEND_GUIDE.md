# User Fields - Frontend Implementation Guide

## Overview
The user object returned from the login endpoint and user endpoints now includes additional fields for contact information, profile picture, and consent tracking.

## Updated Login Response Structure

### POST `/api/auth/login`

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "phone": "+1234567890",
    "picture": "/uploads/1/users/1768654262571_profile.png",
    "privacyPolicyAccepted": true,
    "termsAccepted": true,
    "consentAcceptedAt": "2026-01-17T12:00:00Z",
    "company_id": 1,
    "roles": ["admin", "teacher"],
    "allowedPages": ["/settings", "/users", "/students"],
    "company": {
      "id": 1,
      "name": "Acme School",
      "email": "admin@acme.edu"
    }
  }
}
```

## New User Fields

### 1. `phone` (string | null)
- **Type:** `string | null`
- **Description:** User's phone number
- **Example:** `"+1234567890"` or `null`
- **Usage:** Display contact information, optional field

### 2. `picture` (string | null)
- **Type:** `string | null`
- **Description:** Relative path to user's profile picture
- **Format:** `/uploads/{companyId}/users/{timestamp}_{filename}`
- **Example:** `"/uploads/1/users/1768654262571_Screenshot_2025-06-29_005817.png"` or `null`
- **Full URL:** `{API_BASE_URL}{picture}`
- **Usage:** Display user avatar/profile picture

### 3. `privacyPolicyAccepted` (boolean)
- **Type:** `boolean`
- **Description:** Whether user has accepted the Privacy Policy
- **Default:** `false`
- **Required for registration:** `true`

### 4. `termsAccepted` (boolean)
- **Type:** `boolean`
- **Description:** Whether user has accepted the Terms of Use
- **Default:** `false`
- **Required for registration:** `true`

### 5. `consentAcceptedAt` (string | null)
- **Type:** `string | null` (ISO 8601 datetime)
- **Description:** Timestamp when user accepted privacy policy and terms
- **Format:** ISO 8601 datetime string
- **Example:** `"2026-01-17T12:00:00Z"` or `null`

## Frontend Implementation Examples

### TypeScript Interface

```typescript
interface User {
  id: number;
  email: string;
  username: string;
  phone: string | null;
  picture: string | null;
  privacyPolicyAccepted: boolean;
  termsAccepted: boolean;
  consentAcceptedAt: string | null;
  company_id: number;
  roles: string[];
  allowedPages: string[];
  company: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface LoginResponse {
  token: string;
  user: User;
}
```

### React Example - Displaying User Picture

```typescript
import React from 'react';

interface UserProfileProps {
  user: User;
  apiBaseUrl: string; // e.g., "http://localhost:3000"
}

const UserProfile: React.FC<UserProfileProps> = ({ user, apiBaseUrl }) => {
  // Build full picture URL
  const pictureUrl = user.picture 
    ? `${apiBaseUrl}${user.picture}`
    : '/default-avatar.png'; // Fallback to default avatar

  return (
    <div className="user-profile">
      <img 
        src={pictureUrl} 
        alt={`${user.username}'s profile`}
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.src = '/default-avatar.png';
        }}
      />
      <h2>{user.username}</h2>
      {user.phone && <p>Phone: {user.phone}</p>}
      <p>Email: {user.email}</p>
    </div>
  );
};
```

### Vue.js Example - Displaying User Picture

```vue
<template>
  <div class="user-profile">
    <img 
      :src="pictureUrl" 
      :alt="`${user.username}'s profile`"
      @error="handleImageError"
    />
    <h2>{{ user.username }}</h2>
    <p v-if="user.phone">Phone: {{ user.phone }}</p>
    <p>Email: {{ user.email }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface User {
  picture: string | null;
  username: string;
  phone: string | null;
  email: string;
}

const props = defineProps<{
  user: User;
  apiBaseUrl: string;
}>();

const pictureUrl = computed(() => {
  return props.user.picture 
    ? `${props.apiBaseUrl}${props.user.picture}`
    : '/default-avatar.png';
});

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/default-avatar.png';
};
</script>
```

### Updating User Picture

```typescript
// Using FormData for file upload
const updateUserPicture = async (userId: number, file: File, token: string) => {
  const formData = new FormData();
  formData.append('picture', file);
  
  // Optionally add other fields
  formData.append('phone', userData.phone);
  formData.append('username', userData.username);

  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - browser will set it with boundary
    },
    body: formData
  });

  const updatedUser = await response.json();
  return updatedUser;
};

// Using Axios
import axios from 'axios';

const updateUserPicture = async (userId: number, file: File, token: string) => {
  const formData = new FormData();
  formData.append('picture', file);

  const response = await axios.patch(
    `${API_BASE_URL}/api/users/${userId}`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
};
```

### Registration with Consent Fields

```typescript
const register = async (registerData: {
  email: string;
  username: string;
  password: string;
  company_id: number;
  phone?: string;
  privacyPolicyAccepted: boolean;
  termsAccepted: boolean;
}) => {
  // Validation: Both must be true
  if (!registerData.privacyPolicyAccepted || !registerData.termsAccepted) {
    throw new Error('You must accept the Privacy Policy and Terms of Use');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...registerData,
      consentAcceptedAt: new Date().toISOString(), // Backend sets this automatically
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return await response.json();
};
```

## Picture URL Handling

### Important Notes:

1. **Relative Paths:** The `picture` field contains a relative path starting with `/uploads/...`
2. **Full URL Construction:** Combine with your API base URL:
   ```typescript
   const fullUrl = user.picture ? `${API_BASE_URL}${user.picture}` : null;
   ```
3. **Static File Serving:** Files are served directly (not under `/api` prefix)
   - ✅ Correct: `http://localhost:3000/uploads/1/users/...`
   - ❌ Wrong: `http://localhost:3000/api/uploads/1/users/...`
4. **Null Handling:** Always check for `null` before using the picture URL
5. **Error Handling:** Provide a fallback image if the picture fails to load

### Example: Picture URL Helper

```typescript
const getPictureUrl = (picture: string | null, apiBaseUrl: string): string => {
  if (!picture) {
    return '/default-avatar.png'; // Your default avatar
  }
  
  // Ensure picture starts with /
  const path = picture.startsWith('/') ? picture : `/${picture}`;
  return `${apiBaseUrl}${path}`;
};

// Usage
const avatarUrl = getPictureUrl(user.picture, API_BASE_URL);
```

## User Update Endpoint

### PATCH `/api/users/:id`

**Supports multipart/form-data for picture upload:**

```typescript
// Update user with picture
const formData = new FormData();
formData.append('picture', file); // File object
formData.append('phone', '+1234567890');
formData.append('username', 'newusername');

const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});
```

**Allowed file types:**
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)

**File size limit:** 2MB

**Response:** Returns updated user object with new `picture` path

## Migration Checklist

- [ ] Update TypeScript interfaces to include new fields
- [ ] Update login response handling to store new fields
- [ ] Update user profile components to display picture
- [ ] Add picture upload functionality to user settings
- [ ] Update registration form to include consent checkboxes
- [ ] Add validation for consent acceptance
- [ ] Update user update forms to support picture upload
- [ ] Add fallback/default avatar handling
- [ ] Test picture URL construction and loading

## Common Issues & Solutions

### Issue: `user.picture` is `null` or empty
**Solution:** 
- Check if user has uploaded a picture
- Provide a default avatar fallback
- Ensure picture field is included in login response (should be fixed now)

### Issue: Picture URL returns 404
**Solution:**
- Verify API base URL is correct
- Ensure static file serving is configured
- Check that file path doesn't include `/api` prefix
- Verify file exists in `uploads/{companyId}/users/` directory

### Issue: Picture not updating after upload
**Solution:**
- Verify FormData is being sent correctly
- Check that `Content-Type` header is NOT manually set (let browser set it)
- Ensure file size is under 2MB
- Verify file type is allowed (JPEG, PNG, GIF, WebP)
- Refresh user data after successful update

## API Endpoints Summary

| Endpoint | Method | New Fields Included |
|----------|--------|---------------------|
| `/api/auth/login` | POST | ✅ All new fields |
| `/api/users/:id` | GET | ✅ All new fields |
| `/api/users/:id` | PATCH | ✅ Supports picture upload |
| `/api/users` | GET | ✅ All new fields |
| `/api/auth/register` | POST | ✅ Requires consent fields |

## Testing

Test the following scenarios:
1. Login and verify all new fields are present in response
2. Display user picture in profile component
3. Upload new picture and verify URL is returned
4. Handle null/empty picture gracefully
5. Verify consent fields are required during registration
6. Test picture URL construction with different API base URLs
