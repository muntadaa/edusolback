# Frontend Teacher Fields Guide

## Overview
This guide explains the new fields added to the Teacher entity: `codePostal` (required), `email2` (optional backup email), and `phone2` (optional backup phone).

## New Fields Added

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `codePostal` | string | ✅ **Yes** | Postal code of the teacher |
| `email2` | string | ❌ No | Backup/secondary email address |
| `phone2` | string | ❌ No | Backup/secondary phone number |

## API Endpoints

### Create Teacher
**Endpoint:** `POST /api/teachers`
**Content-Type:** `multipart/form-data` (supports picture upload)

### Update Teacher
**Endpoint:** `PATCH /api/teachers/:id`
**Content-Type:** `multipart/form-data` (supports picture upload)

### Get Teacher
**Endpoint:** `GET /api/teachers/:id`

## API Request/Response Examples

### Create Teacher Request

```json
{
  "first_name": "Robert",
  "last_name": "Smith",
  "email": "robert.smith@school.com",
  "email2": "backup.email@example.com",  // ✅ Optional backup email
  "phone": "+1-555-0200",
  "phone2": "+1-555-0201",  // ✅ Optional backup phone
  "address": "742 Evergreen Terrace",
  "city": "Springfield",
  "country": "USA",
  "codePostal": "75001",  // ✅ Required postal code
  "nationality": "American",
  "gender": "male",
  "birthday": "1985-11-04"
}
```

### Get Teacher Response

```json
{
  "id": 1,
  "gender": "male",
  "first_name": "Robert",
  "last_name": "Smith",
  "birthday": "1985-11-04",
  "email": "robert.smith@school.com",
  "email2": "backup.email@example.com",  // ✅ New field
  "phone": "+1-555-0200",
  "phone2": "+1-555-0201",  // ✅ New field
  "address": "742 Evergreen Terrace",
  "city": "Springfield",
  "country": "USA",
  "codePostal": "75001",  // ✅ New field (required)
  "nationality": "American",
  "picture": "/uploads/teachers/1700000000000_portrait.png",
  "status": 2,
  "company_id": 4,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## Frontend Implementation Examples

### React/TypeScript Example

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  email2?: string;  // ✅ Backup email
  phone?: string;
  phone2?: string;  // ✅ Backup phone
  address?: string;
  city?: string;
  country?: string;
  codePostal: string;  // ✅ Required postal code
  nationality?: string;
  gender?: string;
  birthday?: string;
  picture?: string;
  status: number;
  company_id: number;
  created_at: string;
  updated_at: string;
}

const TeacherForm = ({ teacherId }: { teacherId?: number }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    email2: '',  // ✅ Backup email
    phone: '',
    phone2: '',  // ✅ Backup phone
    address: '',
    city: '',
    country: '',
    codePostal: '',  // ✅ Required
    nationality: '',
    gender: '',
    birthday: '',
  });
  const [loading, setLoading] = useState(false);

  // Fetch teacher data for editing
  useEffect(() => {
    if (teacherId) {
      const fetchTeacher = async () => {
        try {
          const response = await axios.get(`/api/teachers/${teacherId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          
          const teacher = response.data;
          setFormData({
            first_name: teacher.first_name || '',
            last_name: teacher.last_name || '',
            email: teacher.email || '',
            email2: teacher.email2 || '',  // ✅ Backup email
            phone: teacher.phone || '',
            phone2: teacher.phone2 || '',  // ✅ Backup phone
            address: teacher.address || '',
            city: teacher.city || '',
            country: teacher.country || '',
            codePostal: teacher.codePostal || '',  // ✅ Required
            nationality: teacher.nationality || '',
            gender: teacher.gender || '',
            birthday: teacher.birthday || '',
          });
        } catch (error) {
          console.error('Failed to fetch teacher:', error);
        }
      };
      fetchTeacher();
    }
  }, [teacherId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof typeof formData];
        if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value);
        }
      });

      if (teacherId) {
        // Update existing teacher
        await axios.patch(`/api/teachers/${teacherId}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Create new teacher
        await axios.post('/api/teachers', formDataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      alert(teacherId ? 'Teacher updated successfully!' : 'Teacher created successfully!');
    } catch (error: any) {
      console.error('Failed to save teacher:', error);
      alert(error.response?.data?.message || 'Failed to save teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>First Name *</label>
        <input
          type="text"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Last Name *</label>
        <input
          type="text"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Primary Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Backup Email (Optional)</label>
        <input
          type="email"
          value={formData.email2}
          onChange={(e) => setFormData({ ...formData, email2: e.target.value })}
          placeholder="backup.email@example.com"
        />
      </div>

      <div>
        <label>Primary Phone (Optional)</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1-555-0200"
        />
      </div>

      <div>
        <label>Backup Phone (Optional)</label>
        <input
          type="tel"
          value={formData.phone2}
          onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
          placeholder="+1-555-0201"
        />
      </div>

      <div>
        <label>Address (Optional)</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <label>City (Optional)</label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
      </div>

      <div>
        <label>Country (Optional)</label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        />
      </div>

      <div>
        <label>Postal Code *</label>
        <input
          type="text"
          value={formData.codePostal}
          onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
          required
          placeholder="75001"
        />
      </div>

      <div>
        <label>Nationality (Optional)</label>
        <input
          type="text"
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : teacherId ? 'Update Teacher' : 'Create Teacher'}
      </button>
    </form>
  );
};
```

### Vue.js/TypeScript Example

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>First Name *</label>
      <input v-model="formData.first_name" type="text" required />
    </div>

    <div>
      <label>Last Name *</label>
      <input v-model="formData.last_name" type="text" required />
    </div>

    <div>
      <label>Primary Email *</label>
      <input v-model="formData.email" type="email" required />
    </div>

    <div>
      <label>Backup Email (Optional)</label>
      <input
        v-model="formData.email2"
        type="email"
        placeholder="backup.email@example.com"
      />
    </div>

    <div>
      <label>Primary Phone (Optional)</label>
      <input v-model="formData.phone" type="tel" placeholder="+1-555-0200" />
    </div>

    <div>
      <label>Backup Phone (Optional)</label>
      <input
        v-model="formData.phone2"
        type="tel"
        placeholder="+1-555-0201"
      />
    </div>

    <div>
      <label>Address (Optional)</label>
      <input v-model="formData.address" type="text" />
    </div>

    <div>
      <label>City (Optional)</label>
      <input v-model="formData.city" type="text" />
    </div>

    <div>
      <label>Country (Optional)</label>
      <input v-model="formData.country" type="text" />
    </div>

    <div>
      <label>Postal Code *</label>
      <input
        v-model="formData.codePostal"
        type="text"
        required
        placeholder="75001"
      />
    </div>

    <div>
      <label>Nationality (Optional)</label>
      <input v-model="formData.nationality" type="text" />
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Saving...' : teacherId ? 'Update Teacher' : 'Create Teacher' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

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
  gender?: string;
  birthday?: string;
  picture?: string;
  status: number;
  company_id: number;
  created_at: string;
  updated_at: string;
}

const props = defineProps<{
  teacherId?: number;
}>();

const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  email2: '',
  phone: '',
  phone2: '',
  address: '',
  city: '',
  country: '',
  codePostal: '',
  nationality: '',
  gender: '',
  birthday: '',
});

const loading = ref(false);

const fetchTeacher = async () => {
  if (!props.teacherId) return;
  
  try {
    const response = await axios.get(`/api/teachers/${props.teacherId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    const teacher = response.data;
    formData.value = {
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      email: teacher.email || '',
      email2: teacher.email2 || '',
      phone: teacher.phone || '',
      phone2: teacher.phone2 || '',
      address: teacher.address || '',
      city: teacher.city || '',
      country: teacher.country || '',
      codePostal: teacher.codePostal || '',
      nationality: teacher.nationality || '',
      gender: teacher.gender || '',
      birthday: teacher.birthday || '',
    };
  } catch (error) {
    console.error('Failed to fetch teacher:', error);
  }
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    const formDataToSend = new FormData();
    Object.keys(formData.value).forEach(key => {
      const value = formData.value[key as keyof typeof formData.value];
      if (value !== null && value !== undefined && value !== '') {
        formDataToSend.append(key, value);
      }
    });

    if (props.teacherId) {
      await axios.patch(`/api/teachers/${props.teacherId}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      await axios.post('/api/teachers', formDataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    alert(props.teacherId ? 'Teacher updated successfully!' : 'Teacher created successfully!');
  } catch (error: any) {
    console.error('Failed to save teacher:', error);
    alert(error.response?.data?.message || 'Failed to save teacher');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTeacher();
});
</script>
```

## Important Notes

### 1. Required Field
- **`codePostal`** is **required** when creating a new teacher
- The API will return a validation error if `codePostal` is missing or empty

### 2. Optional Fields
- **`email2`** - Optional backup email (must be valid email format if provided)
- **`phone2`** - Optional backup phone number

### 3. Form Data Handling
- When using `multipart/form-data` (for picture uploads), use `FormData` object
- All fields are automatically included in GET responses
- For updates, only include fields that have changed

### 4. Validation
- `email2` must be a valid email format if provided
- `codePostal` cannot be empty or null
- Primary `email` is required and must be unique

## Testing Checklist

- [ ] Create teacher with all new fields
- [ ] Create teacher with only required fields (codePostal)
- [ ] Create teacher without codePostal (should fail validation)
- [ ] Update teacher with new fields
- [ ] GET teacher returns all new fields
- [ ] email2 validation works (invalid email should fail)
- [ ] All fields are optional for updates except codePostal (if provided)

## Database Migration Required

You'll need to add these columns to the `teachers` table:

```sql
ALTER TABLE teachers ADD COLUMN email2 VARCHAR(255) NULL;
ALTER TABLE teachers ADD COLUMN phone2 VARCHAR(255) NULL;
ALTER TABLE teachers ADD COLUMN codePostal VARCHAR(255) NOT NULL;
```

Or using TypeORM migrations:
```bash
npm run typeorm migration:generate -- -n AddContactFieldsToTeacher
npm run typeorm migration:run
```

**Note:** If you have existing teachers, you'll need to provide a default value for `codePostal` or update existing records first.
