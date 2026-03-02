# School Authentication API

A NestJS-based authentication and school management system with JWT authentication, user management, company management, course management, and module management.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-auth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy the `.env.example` file to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and update the following variables:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your_password
   DB_NAME=edusol_25

   # Application Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Configuration
   SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h

   # Email Configuration (for password reset)
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_app_password

   # Winston Logging Configuration
   LOG_LEVEL=debug
   LOG_DIR=logs
   ```

4. **Database Setup**
   - Create a MySQL database named `edusol_25` (or update the DB_NAME in .env)
   - The application will automatically create tables on startup (synchronize: true in development)

### Running the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
# Build the application
npm run build

# Start in production
npm run start:prod
```

#### Other Available Scripts
```bash
# Start with debugging
npm run start:debug

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```


## 📚 API Documentation

### Additional Documentation

- **[Pages Global Initialization Guide](./docs/PAGES_GLOBAL_INITIALIZATION_GUIDE.md)** - Frontend guide for initializing global pages on startup
- **[Validation Guide](./docs/VALIDATION_GUIDE.md)** - School Years & Periods validation rules
- **[Classroom Types Guide](./docs/CLASSROOM_TYPES_GUIDE.md)** - Classroom Types & Classrooms relationship guide

## 🔍 Pagination, Search & Filtering

All list endpoints (`/users`, `/course`, `/module` , `/school-years` , `/school-year-periods`  ) now support advanced pagination, search, and filtering capabilities:

### Common Features
- **Pagination**: Default 10 items per page, configurable via `limit` parameter (max: 100)
- **Search**: Text-based search functionality
- **Filtering**: Status-based filtering (where applicable)
- **Sorting**: Results ordered by creation date (newest first)

### Response Format
All paginated endpoints return data in the following format:
```json
{
  "data": [...], // Array of items
  "meta": {
    "page": 1,           // Current page
    "limit": 10,         // Items per page
    "total": 50,         // Total items
    "totalPages": 5,     // Total pages
    "hasNext": true,     // Has next page
    "hasPrevious": false // Has previous page
  }
}
```

### Performance Considerations
- Database queries are optimized with proper indexing
- Maximum limit of 100 items per page to prevent performance issues
- Efficient pagination using `skip()` and `take()` methods
- Left joins for related data to avoid N+1 queries

## 🎯 **Drag-and-Drop Course Management**

The system now supports drag-and-drop interfaces for managing course-module relationships:

### **Module-Centric View**
- **GET `/module/:id/courses`** - Get assigned/unassigned courses for a module
- **POST `/module/:id/courses`** - Batch assign/unassign courses to/from a module
- **POST `/module/:id/courses/:courseId`** - Add a single course to a module
- **DELETE `/module/:id/courses/:courseId`** - Remove a single course from a module

### **Course-Centric View**
- **GET `/course/:id/modules`** - Get assigned/unassigned modules for a course
- **POST `/course/:id/modules`** - Batch assign/unassign modules to/from a course
- **POST `/course/:id/modules/:moduleId`** - Add a single module to a course
- **DELETE `/course/:id/modules/:moduleId`** - Remove a single module from a course

### **Frontend Integration**
These endpoints are designed for drag-and-drop interfaces where:
- **Left Column**: Unassigned items (courses or modules)
- **Right Column**: Assigned items (courses or modules)
- **Single Drag**: Use individual endpoints (`POST /:id/courses/:courseId`)
- **Multiple Drag**: Use batch endpoints (`POST /:id/courses` with add/remove arrays)
- **Real-time Updates**: Immediate feedback on successful operations

### **Database Safety**
- All operations use database transactions for data integrity
- Duplicate prevention with `INSERT IGNORE` statements
- Proper foreign key constraints with CASCADE delete
- Batch operations for optimal performance



### Authentication Endpoints

#### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "role": "user"
  }
}
```

#### POST `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "role": "user" // optional: "user" or "admin"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "role": "user"
  }
}
```

#### POST `/auth/forgot-password`
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST `/auth/reset-password?token=<reset_token>`
Reset password with token.

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

#### POST `/auth/change-password`
Change password (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### User Management Endpoints

#### GET `/users`
Get all users with pagination, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by email or username

**Example Requests:**
```
GET /users?page=1&limit=10
GET /users?search=john&page=1
GET /users?search=john@example.com&page=1&limit=5
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "company_id": 1,
      "company": { "id": 1, "name": "Tech Corp" },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### POST `/users`
Create a new user.

**Request Body:**
```json
{
  "username": "username",
  "password": "password123",
  "email": "user@example.com",
  "role": "user", // optional: "user" or "admin"
  "company_id": 1 // optional
}
```

#### GET `/users/:id`
Get user by ID.

#### PATCH `/users/:id`
Update user by ID.

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "role": "admin"
}
```

#### DELETE `/users/:id`
Delete user by ID.

### Company Management Endpoints

#### GET `/company`
Get all companies.

#### POST `/company`
Create a new company.

**Request Body:**
```json
{
  "name": "Company Name",
  "logo": "logo_url", // optional
  "email": "company@example.com",
  "phone": "+1234567890", // optional
  "website": "https://company.com" // optional
}
```

#### GET `/company/:id`
Get company by ID.

#### PATCH `/company/:id`
Update company by ID.

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "email": "updated@example.com",
  "phone": "+9876543210"
}
```

#### DELETE `/company/:id`
Delete company by ID.

### Course Management Endpoints

#### GET `/course`
Get all courses with pagination, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by course title
- `status` (optional): Filter by status (0 or 1)

**Example Requests:**
```
GET /course?page=1&limit=10
GET /course?search=javascript&page=1
GET /course?status=1&page=1&limit=5
GET /course?search=react&status=1&page=2
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript basics",
      "volume": 40,
      "coefficient": 0.2,
      "status": 1,
      "company_id": 1,
      "company": { "id": 1, "name": "Tech Corp" },
      "modules": [...],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### POST `/course`
Create a new course.

**Request Body:**
```json
{
  "name": "Course Name",
  "description": "Course description",
  "duration": 120 // in minutes
}
```

#### GET `/course/:id`
Get course by ID.

#### PATCH `/course/:id`
Update course by ID.

**Request Body:**
```json
{
  "name": "Updated Course Name",
  "description": "Updated description",
  "duration": 180
}
```

#### DELETE `/course/:id`
Delete course by ID.

#### POST `/course/:id/modules/:moduleId`
Add module to course.

#### DELETE `/course/:id/modules/:moduleId`
Remove module from course.

#### GET `/course/:id/modules`
Get modules assigned and unassigned to a course for drag-and-drop interface.

**Response:**
```json
{
  "assigned": [
    {
      "id": 1,
      "title": "React Fundamentals",
      "description": "Learn React basics",
      "volume": 30,
      "coefficient": 0.1,
      "status": 1,
      "company_id": 1,
      "company": { "id": 1, "name": "Tech Corp" },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "unassigned": [
    {
      "id": 2,
      "title": "Node.js Advanced",
      "description": "Advanced Node.js concepts",
      "volume": 45,
      "coefficient": 0.2,
      "status": 1,
      "company_id": 1,
      "company": { "id": 1, "name": "Tech Corp" },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/course/:id/modules`
Batch assign/unassign modules to/from a course.

**Request Body:**
```json
{
  "add": [1, 2, 3],
  "remove": [4, 5]
}
```

**Response:**
```json
{
  "message": "Module assignments updated successfully",
  "affected": 5
}
```

#### POST `/course/:id/modules/:moduleId`
Add a single module to a course.

**Response:**
```json
{
  "message": "Module successfully assigned to course",
  "module": {
    "id": 1,
    "title": "React Fundamentals",
    "description": "Learn React basics",
    "volume": 30,
    "coefficient": 0.1,
    "status": 1,
    "company_id": 1,
    "company": { "id": 1, "name": "Tech Corp" },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### DELETE `/course/:id/modules/:moduleId`
Remove a single module from a course.

**Response:**
```json
{
  "message": "Module successfully removed from course"
}
```

### Module Management Endpoints

#### GET `/module`
Get all modules with pagination, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by module title
- `status` (optional): Filter by status (0 or 1)

**Example Requests:**
```
GET /module?page=1&limit=10
GET /module?search=react&page=1
GET /module?status=1&page=1&limit=5
GET /module?search=node&status=1&page=2
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "React Fundamentals",
      "description": "Learn React basics",
      "volume": 30,
      "coefficient": 0.1,
      "status": 1,
      "company_id": 1,
      "company": { "id": 1, "name": "Tech Corp" },
      "courses": [...],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### POST `/module`
Create a new module.

**Request Body:**
```json
{
  "name": "Module Name",
  "description": "Module description",
  "duration": 60 // in minutes
}
```

#### GET `/module/:id`
Get module by ID.

#### PATCH `/module/:id`
Update module by ID.

**Request Body:**
```json
{
  "name": "Updated Module Name",
  "description": "Updated description",
  "duration": 90
}
```

#### DELETE `/module/:id`
Delete module by ID.

#### POST `/module/:id/courses/:courseId`
Add course to module.

#### DELETE `/module/:id/courses/:courseId`
Remove course from module.

#### GET `/module/:id/courses`
Get courses assigned and unassigned to a module for drag-and-drop interface.

**Response:**
```json
{
  "assigned": [
    {
      "id": 1,
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript basics",
      "volume": 40,
      "coefficient": 0.2,
      "status": 1,
      "company_id": 1,
      "company": { "id": 1, "name": "Tech Corp" },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "unassigned": [
    {
      "id": 2,
      "title": "Python Basics",
      "description": "Learn Python programming",
      "volume": 35,
      "coefficient": 0.15,
      "status": 1,
      "company_id": 1,
      "company": { "id": 1, "name": "Tech Corp" },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/module/:id/courses`
Batch assign/unassign courses to/from a module.

**Request Body:**
```json
{
  "add": [1, 2, 3],
  "remove": [4, 5]
}
```

**Response:**
```json
{
  "message": "Course assignments updated successfully",
  "affected": 5
}
```

#### POST `/module/:id/courses/:courseId`
Add a single course to a module.

**Response:**
```json
{
  "message": "Course successfully assigned to module",
  "course": {
    "id": 1,
    "title": "JavaScript Fundamentals",
    "description": "Learn JavaScript basics",
    "volume": 40,
    "coefficient": 0.2,
    "status": 1,
    "company_id": 1,
    "company": { "id": 1, "name": "Tech Corp" },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### DELETE `/module/:id/courses/:courseId`
Remove a single course from a module.

**Response:**
```json
{
  "message": "Course successfully removed from module"
}
```

## School Year Management Endpoints

Base path: /school-years

**⚠️ Important Validation Rules:**
- **At most one ongoing school year** can exist (max: 1, min: 0 allowed for initial setup)
- **Recommended**: 1 ongoing school year should exist (frontend should show warning if 0 exist)
- The `lifecycle_status` field can be: `'planned'`, `'ongoing'`, or `'completed'`
- See [Validation Guide](./docs/VALIDATION_GUIDE.md) for detailed frontend implementation guidelines

1) Create — POST /school-years
Request JSON:
```json
{
  "companyId": 1,
  "title": "2025-2026",
  "start_date": "2025-09-01",
  "end_date": "2026-06-30",
  "status": 1,
  "lifecycle_status": "ongoing"
}
```
Notes:
- status mapping: 0=disabled, 1=active, 2=pending, -1=archived, -2=deleted
- lifecycle_status: 'planned', 'ongoing', or 'completed'
- Validation: start_date and end_date must be valid ISO date strings and end_date must be greater than start_date.
- **Validation Error**: If setting `lifecycle_status` to `'ongoing'` when another year is already ongoing, returns `400 Bad Request` with message: "There must be exactly one ongoing school year. Another school year is already ongoing."
Example curl:
```bash
curl -X POST http://localhost:3000/school-years \
  -H "Content-Type: application/json" \
  -d '{"companyId":1,"title":"2025-2026","start_date":"2025-09-01","end_date":"2026-06-30","status":1}'
```

2) Get all — GET /school-years
Response: array of school year objects (includes company relation).

3) Get one — GET /school-years/:id
Path param: id (number). Returns single school year or 404.

4) Update — PATCH /school-years/:id
Request JSON: partial fields allowed. Dates validated (end_date > start_date).
Example:
```json
{
  "title": "2025-2026 (updated)",
  "end_date": "2026-07-01",
  "status": "archived",
  "lifecycle_status": "completed"
}
```
**Validation Errors:**
- Cannot set a year to `'ongoing'` if another year is already ongoing
- **Note**: Changing the only ongoing year to another status is allowed (0 ongoing years is permitted for initial setup). Frontend should show a warning if no ongoing years exist.

5) Delete — DELETE /school-years/:id
Removes the school year (returns removed entity or 404).

---

## School Year Periods (Semesters) Management Endpoints

Base path: /school-year-periods

This resource represents periods (semesters) tied to a SchoolYear. Each period has the same fields as SchoolYear plus a foreign key schoolYearId.

**⚠️ Important Validation Rules:**
- **Exactly one ongoing period per school year** must exist at all times (min: 1, max: 1 per school year)
- The `lifecycle_status` field can be: `'planned'`, `'ongoing'`, or `'completed'`
- Validation is scoped per school year (each school year can have its own ongoing period)
- See [Validation Guide](./docs/VALIDATION_GUIDE.md) for detailed frontend implementation guidelines

1) Create — POST /school-year-periods
Request JSON:
```json
{
  "schoolYearId": 10,
  "title": "Semester 1",
  "start_date": "2025-09-01",
  "end_date": "2025-12-20",
  "status": 1,
  "lifecycle_status": "ongoing"
}
```
Notes:
- schoolYearId must reference an existing school year.
- Dates must be valid and end_date > start_date.
- Status mapping same as SchoolYear.
- lifecycle_status: 'planned', 'ongoing', or 'completed'
- **Validation Error**: If setting `lifecycle_status` to `'ongoing'` when another period in the same school year is already ongoing, returns `400 Bad Request` with message: "There must be exactly one ongoing period per school year. Another period in this school year is already ongoing."
Example curl:
```bash
curl -X POST http://localhost:3000/school-year-periods \
  -H "Content-Type: application/json" \
  -d '{"schoolYearId":10,"title":"Semester 1","start_date":"2025-09-01","end_date":"2025-12-20","status":1}'
```

2) Get all — GET /school-year-periods
Response: array of periods with their parent schoolYear.

3) Get one — GET /school-year-periods/:id
Path param: id (number). Returns single period or 404.

4) Update — PATCH /school-year-periods/:id
Request JSON: partial fields allowed. Can change schoolYearId (validated) and dates (validated).
Example:
```json
{
  "title": "Semester 1 (revised)",
  "lifecycle_status": "completed",
  "end_date": "2025-12-22"
}
```
**Validation Errors:**
- Cannot set a period to `'ongoing'` if another period in the same school year is already ongoing
- **Note**: Changing the only ongoing period in a school year to another status is allowed (0 ongoing periods per school year is permitted for initial setup). Frontend should show a warning if no ongoing periods exist for a school year.
  "end_date": "2025-12-22"
}
```

5) Delete — DELETE /school-year-periods/:id
Removes the period (returns removed entity or 404).

---

Validation & Behavior Notes
- All create/update endpoints return 400 for invalid payloads (invalid dates or end_date <= start_date).
- Relations: SchoolYear includes company (eager) and periods (one-to-many). SchoolYearPeriod has a many-to-one relation back to SchoolYear (ON DELETE CASCADE).
- Use JWT auth header if your app requires authentication for these endpoints:
```
Authorization: Bearer <jwt_token>
```

## 🔐 Authentication

Most endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 🛠️ Technology Stack

- **Framework:** NestJS
- **Database:** MySQL with TypeORM
- **Authentication:** JWT with Passport
- **Validation:** Class Validator
- **Email:** Nodemailer
- **Password Hashing:** bcrypt

## 📁 Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data Transfer Objects
│   ├── guards/          # JWT Auth Guard
│   └── strategies/      # JWT Strategy
├── company/             # Company management
├── course/              # Course management
├── module/              # Module management
├── users/               # User management
├── mail/                # Email service
├── app.module.ts        # Main application module
└── main.ts              # Application entry point
```

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_USERNAME` | Database username | root |
| `DB_PASSWORD` | Database password | (empty) |
| `DB_NAME` | Database name | edusol_25 |
| `PORT` | Application port | 3000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT secret key | (required) |
| `JWT_EXPIRES_IN` | JWT expiration | 24h |
| `LOG_LEVEL` | Winston log level (error/warn/info/debug) | debug (dev), info (prod) |
| `LOG_DIR` | Directory for log files | logs |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request


