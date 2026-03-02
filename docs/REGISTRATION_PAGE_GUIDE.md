# Registration Page Guide - `/registerMyschool`

## 🎯 Overview

The registration page allows users to create a company and become the first admin **without any authentication**. This is a public endpoint that sets up the initial company and admin user.

---

## 📍 Page URL

```
http://localhost:5174/registerMyschool
```

---

## 🔄 Registration Flow

### Step 1: Create Company (Public, No Auth)

**Endpoint:** `POST /company`

**Request:**
```json
{
  "name": "My School Name",
  "email": "school@example.com",
  "phone": "+1234567890",  // optional
  "city": "Paris",          // optional
  "country": "France"       // optional
}
```

**Response:**
```json
{
  "id": 1,
  "name": "My School Name",
  "email": "school@example.com",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Important:** Save the `company.id` for the next step!

---

### Step 2: Register First User (Public, No Auth)

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "username": "admin",
  "company_id": 1  // Use the company ID from step 1
}
```

**⚠️ IMPORTANT - DO NOT SEND:**
- ❌ `profile` field - **REMOVED** (replaced with roles system)
- ❌ `role_ids` field - Not accepted in registration (first user gets admin automatically)

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "company_id": 1
  }
}
```

**What Happens:**
- ✅ User is created
- ✅ **Automatically assigned `admin` role** (first user for company)
- ✅ No JWT token needed (public endpoint)
- ✅ User can now login with these credentials

---

## 💻 Frontend Implementation

### Complete Registration Component

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3000';

function RegisterMySchool() {
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
  });
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Step 1: Create Company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create company');
      }

      const company = await response.json();
      setCompanyId(company.id);
      setStep(2); // Move to user registration
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Register First Admin User
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!companyId) {
      setError('Company ID not found. Please start over.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          username: userData.username,
          company_id: companyId,
          // ❌ DO NOT send: profile (removed), role_ids (not accepted in registration)
          // ✅ First user automatically becomes admin - no fields needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register user');
      }

      const result = await response.json();
      
      // Success! User is now admin
      alert('Registration successful! You are now the admin. Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Register My School</h1>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleCreateCompany}>
          <h2>Step 1: Create Your Company</h2>
          <p>Enter your school/company information</p>
          
          <div>
            <label>Company Name *</label>
            <input
              type="text"
              value={companyData.name}
              onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
              required
              placeholder="My School"
            />
          </div>
          
          <div>
            <label>Company Email *</label>
            <input
              type="email"
              value={companyData.email}
              onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
              required
              placeholder="school@example.com"
            />
          </div>
          
          <div>
            <label>Phone (optional)</label>
            <input
              type="text"
              value={companyData.phone}
              onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
              placeholder="+1234567890"
            />
          </div>
          
          <div>
            <label>City (optional)</label>
            <input
              type="text"
              value={companyData.city}
              onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
              placeholder="Paris"
            />
          </div>
          
          <div>
            <label>Country (optional)</label>
            <input
              type="text"
              value={companyData.country}
              onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
              placeholder="France"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creating Company...' : 'Next: Create Admin Account'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterUser}>
          <h2>Step 2: Create Admin Account</h2>
          <p style={{ color: 'green', fontWeight: 'bold' }}>
            ✅ You will automatically become the admin for your company.
          </p>
          
          <div>
            <label>Username *</label>
            <input
              type="text"
              value={userData.username}
              onChange={(e) => setUserData({ ...userData, username: e.target.value })}
              required
              placeholder="admin"
            />
          </div>
          
          <div>
            <label>Email *</label>
            <input
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              required
              placeholder="admin@example.com"
            />
          </div>
          
          <div>
            <label>Password *</label>
            <input
              type="password"
              value={userData.password}
              onChange={(e) => setUserData({ ...userData, password: e.target.value })}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
          
          <button 
            type="button" 
            onClick={() => setStep(1)}
            style={{ marginLeft: '1rem' }}
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}

export default RegisterMySchool;
```

---

## 🎨 UI/UX Recommendations

1. **Two-Step Form:**
   - Step 1: Company information
   - Step 2: Admin account creation
   - Show progress indicator (Step 1 of 2)

2. **Visual Feedback:**
   - Show loading spinner during API calls
   - Display success/error messages clearly
   - Disable submit button while loading

3. **Validation:**
   - Client-side validation before submission
   - Show required field indicators (*)
   - Password strength indicator

4. **Success Flow:**
   - After successful registration, redirect to login
   - Show message: "Registration successful! Please login with your credentials."
   - Pre-fill email in login form if possible

---

## ⚠️ Important Notes

1. **No Authentication Required:**
   - Both endpoints are public (no JWT token needed)
   - No login required before registration

2. **Automatic Admin Role:**
   - First user for a company automatically gets `admin` role
   - No need to specify `role_ids` in registration
   - System handles this automatically

3. **Company ID Required:**
   - Must create company first to get `company_id`
   - Store `company_id` between steps (state or localStorage)

4. **❌ DO NOT Send These Fields:**
   - **`profile`** - This field has been **REMOVED**. The system now uses roles instead.
   - **`role_ids`** - Not accepted in registration endpoint. First user gets admin automatically.

5. **Error Handling:**
   - Handle duplicate email/username errors
   - Handle company creation failures
   - Show user-friendly error messages
   - If you get "property profile should not exist" → Remove `profile` field from request

---

## 🔍 Testing Checklist

- [ ] Company creation works (Step 1)
- [ ] Company ID is stored correctly
- [ ] User registration works (Step 2)
- [ ] First user automatically gets admin role
- [ ] Error messages display correctly
- [ ] Loading states work properly
- [ ] Redirect to login after success
- [ ] Can login with created credentials
- [ ] Login response includes `roles: ["admin"]`

---

## 🐛 Common Issues

### Issue: "company_id is required"
**Solution:** Make sure company is created first and `company_id` is passed to registration endpoint.

### Issue: "User already exists"
**Solution:** Email or username already exists. Use different credentials.

### Issue: "Admin role not found"
**Solution:** System roles not seeded. Restart backend application.

### Issue: Registration succeeds but can't login
**Solution:** Check if password meets requirements (min 6 characters). Verify login endpoint is correct.

### Issue: "property profile should not exist"
**Solution:** The `profile` field has been removed. **DO NOT send `profile` in the request.** The system now uses roles instead. Remove any `profile` field from your registration request body.

---

## 📝 API Endpoints Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/company` | POST | ❌ No | Create company |
| `/auth/register` | POST | ❌ No | Register first admin user |

---

## ✅ Success Criteria

Registration is successful when:
1. ✅ Company is created and returns `id`
2. ✅ User is created with that `company_id`
3. ✅ User automatically has `admin` role
4. ✅ User can login with created credentials
5. ✅ Login response includes `roles: ["admin"]` and `allowedPages`

---

**Next Steps:** After registration, user should login and access the admin dashboard to manage roles, users, and pages.
