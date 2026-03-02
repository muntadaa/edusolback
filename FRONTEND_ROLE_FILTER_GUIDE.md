# Frontend Role Filter Implementation Guide

## Overview
This guide explains how to implement the role type filter (`is_system`) in the frontend to work with the backend API.

## API Endpoint
**Endpoint:** `GET /api/roles`

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number for pagination (default: 1) |
| `limit` | number | No | Number of items per page (default: 10) |
| `search` | string | No | Search term to filter roles by code or label |
| `is_system` | boolean | No | Filter by role type:<br>- `true`: Returns only system roles<br>- `false`: Returns only custom roles<br>- `undefined`/not provided: Returns all roles |

## Frontend Implementation Examples

### React/TypeScript Example

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Role {
  id: number;
  code: string;
  label: string;
  company_id: number | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface RoleFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_system?: boolean | null; // null means "all", true = system, false = custom
}

const useRoles = (filters: RoleFilters) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();
        
        if (filters.page) {
          params.append('page', filters.page.toString());
        }
        
        if (filters.limit) {
          params.append('limit', filters.limit.toString());
        }
        
        if (filters.search) {
          params.append('search', filters.search);
        }
        
        // IMPORTANT: Handle boolean conversion correctly
        // Only include is_system if it's explicitly true or false (not null/undefined)
        if (filters.is_system !== null && filters.is_system !== undefined) {
          // Convert boolean to string for URL query parameter
          params.append('is_system', filters.is_system.toString());
        }

        const response = await axios.get<PaginatedResponse<Role>>(
          `/api/roles?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        setRoles(response.data.data);
        setPagination(response.data.meta);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [filters.page, filters.limit, filters.search, filters.is_system]);

  return { roles, loading, error, pagination };
};

// Usage in component
const RolesList = () => {
  const [filters, setFilters] = useState<RoleFilters>({
    page: 1,
    limit: 10,
    search: '',
    is_system: null, // null = all roles
  });

  const { roles, loading, error, pagination } = useRoles(filters);

  const handleFilterChange = (filterType: 'all' | 'system' | 'custom') => {
    setFilters(prev => ({
      ...prev,
      is_system: filterType === 'all' ? null : filterType === 'system' ? true : false,
      page: 1, // Reset to first page when filter changes
    }));
  };

  return (
    <div>
      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button
          onClick={() => handleFilterChange('all')}
          className={filters.is_system === null ? 'active' : ''}
        >
          All Roles
        </button>
        <button
          onClick={() => handleFilterChange('system')}
          className={filters.is_system === true ? 'active' : ''}
        >
          System Roles
        </button>
        <button
          onClick={() => handleFilterChange('custom')}
          className={filters.is_system === false ? 'active' : ''}
        >
          Custom Roles
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search roles..."
        value={filters.search || ''}
        onChange={(e) =>
          setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))
        }
      />

      {/* Roles List */}
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <div>
          {roles.map(role => (
            <div key={role.id}>
              <h3>{role.label}</h3>
              <p>Code: {role.code}</p>
              <p>Type: {role.is_system ? 'System' : 'Custom'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={!pagination.hasPrevious}
          onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          disabled={!pagination.hasNext}
          onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

### Vue.js/TypeScript Example

```vue
<template>
  <div>
    <!-- Filter Buttons -->
    <div class="filter-buttons">
      <button
        @click="setFilter('all')"
        :class="{ active: filters.is_system === null }"
      >
        All Roles
      </button>
      <button
        @click="setFilter('system')"
        :class="{ active: filters.is_system === true }"
      >
        System Roles
      </button>
      <button
        @click="setFilter('custom')"
        :class="{ active: filters.is_system === false }"
      >
        Custom Roles
      </button>
    </div>

    <!-- Search Input -->
    <input
      v-model="filters.search"
      type="text"
      placeholder="Search roles..."
      @input="handleSearch"
    />

    <!-- Roles List -->
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-for="role in roles" :key="role.id">
        <h3>{{ role.label }}</h3>
        <p>Code: {{ role.code }}</p>
        <p>Type: {{ role.is_system ? 'System' : 'Custom' }}</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button
        :disabled="!pagination.hasPrevious"
        @click="changePage(pagination.page - 1)"
      >
        Previous
      </button>
      <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
      <button
        :disabled="!pagination.hasNext"
        @click="changePage(pagination.page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';

interface Role {
  id: number;
  code: string;
  label: string;
  company_id: number | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  data: Role[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

const roles = ref<Role[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
});

const filters = ref({
  page: 1,
  limit: 10,
  search: '',
  is_system: null as boolean | null,
});

const fetchRoles = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    
    if (filters.value.page) {
      params.append('page', filters.value.page.toString());
    }
    
    if (filters.value.limit) {
      params.append('limit', filters.value.limit.toString());
    }
    
    if (filters.value.search) {
      params.append('search', filters.value.search);
    }
    
    // IMPORTANT: Only include is_system if it's explicitly true or false
    if (filters.value.is_system !== null && filters.value.is_system !== undefined) {
      params.append('is_system', filters.value.is_system.toString());
    }

    const response = await axios.get<PaginatedResponse>(
      `/api/roles?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    roles.value = response.data.data;
    pagination.value = response.data.meta;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch roles';
  } finally {
    loading.value = false;
  }
};

const setFilter = (type: 'all' | 'system' | 'custom') => {
  filters.value.is_system = type === 'all' ? null : type === 'system' ? true : false;
  filters.value.page = 1; // Reset to first page
  fetchRoles();
};

const handleSearch = () => {
  filters.value.page = 1; // Reset to first page
  fetchRoles();
};

const changePage = (page: number) => {
  filters.value.page = page;
  fetchRoles();
};

// Watch for filter changes
watch(
  () => [filters.value.page, filters.value.limit, filters.value.search, filters.value.is_system],
  () => {
    fetchRoles();
  }
);

onMounted(() => {
  fetchRoles();
});
</script>
```

### Angular Example

```typescript
// roles.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Role {
  id: number;
  code: string;
  label: string;
  company_id: number | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface RoleFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_system?: boolean | null;
}

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private apiUrl = '/api/roles';

  constructor(private http: HttpClient) {}

  getRoles(filters: RoleFilters): Observable<PaginatedResponse<Role>> {
    let params = new HttpParams();

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    // IMPORTANT: Only include is_system if it's explicitly true or false
    if (filters.is_system !== null && filters.is_system !== undefined) {
      params = params.set('is_system', filters.is_system.toString());
    }

    return this.http.get<PaginatedResponse<Role>>(this.apiUrl, { params });
  }
}
```

```typescript
// roles.component.ts
import { Component, OnInit } from '@angular/core';
import { RolesService, Role, RoleFilters } from './roles.service';

@Component({
  selector: 'app-roles',
  template: `
    <div>
      <!-- Filter Buttons -->
      <div class="filter-buttons">
        <button
          (click)="setFilter('all')"
          [class.active]="filters.is_system === null"
        >
          All Roles
        </button>
        <button
          (click)="setFilter('system')"
          [class.active]="filters.is_system === true"
        >
          System Roles
        </button>
        <button
          (click)="setFilter('custom')"
          [class.active]="filters.is_system === false"
        >
          Custom Roles
        </button>
      </div>

      <!-- Search Input -->
      <input
        type="text"
        placeholder="Search roles..."
        [(ngModel)]="filters.search"
        (input)="onSearchChange()"
      />

      <!-- Roles List -->
      <div *ngIf="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <div *ngIf="!loading && !error">
        <div *ngFor="let role of roles">
          <h3>{{ role.label }}</h3>
          <p>Code: {{ role.code }}</p>
          <p>Type: {{ role.is_system ? 'System' : 'Custom' }}</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button
          [disabled]="!pagination.hasPrevious"
          (click)="changePage(pagination.page - 1)"
        >
          Previous
        </button>
        <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
        <button
          [disabled]="!pagination.hasNext"
          (click)="changePage(pagination.page + 1)"
        >
          Next
        </button>
      </div>
    </div>
  `,
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  loading = false;
  error: string | null = null;
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  filters: RoleFilters = {
    page: 1,
    limit: 10,
    search: '',
    is_system: null,
  };

  constructor(private rolesService: RolesService) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loading = true;
    this.error = null;

    this.rolesService.getRoles(this.filters).subscribe({
      next: (response) => {
        this.roles = response.data;
        this.pagination = response.meta;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to fetch roles';
        this.loading = false;
      },
    });
  }

  setFilter(type: 'all' | 'system' | 'custom') {
    this.filters.is_system = type === 'all' ? null : type === 'system' ? true : false;
    this.filters.page = 1;
    this.loadRoles();
  }

  onSearchChange() {
    this.filters.page = 1;
    this.loadRoles();
  }

  changePage(page: number) {
    this.filters.page = page;
    this.loadRoles();
  }
}
```

## Important Notes

### 1. Boolean Parameter Handling
When sending boolean values in URL query parameters:
- ✅ **Correct**: `is_system=true` or `is_system=false` (as strings)
- ❌ **Wrong**: Don't send the parameter at all if you want "all roles"
- ✅ **Best Practice**: Only include the parameter when it has a value (true or false)

### 2. Filter State Management
- Use `null` or `undefined` to represent "all roles"
- Use `true` for system roles only
- Use `false` for custom roles only
- Always reset `page` to 1 when changing filters

### 3. URL Query String Format
```
GET /api/roles?page=1&limit=10&is_system=false
```

The backend will automatically convert the string `"false"` to boolean `false`.

### 4. Common Issues and Solutions

**Issue**: Filter doesn't work for custom roles
- **Solution**: Make sure you're sending `is_system=false` (as a string), not `is_system=0` or omitting it

**Issue**: All roles show when filtering for custom
- **Solution**: Check that the boolean is being converted correctly. Use `.toString()` when building the URL

**Issue**: Filter resets on page change
- **Solution**: Make sure filter state is preserved when changing pages

## Testing Checklist

- [ ] "All Roles" button shows both system and custom roles
- [ ] "System Roles" button shows only system roles
- [ ] "Custom Roles" button shows only custom roles
- [ ] Search works with all filter types
- [ ] Pagination works with all filter types
- [ ] Filter state persists when changing pages
- [ ] Filter resets page to 1 when changed
- [ ] Loading states display correctly
- [ ] Error messages display correctly
