# User Registration Without CAPTCHA - First User Guide

## Overview

When creating the **first admin user** for a newly created company, the CAPTCHA token is **NOT required** for user registration because the CAPTCHA was already verified during company creation.

## Flow

```
1. Generate CAPTCHA → Get token
2. Pre-verify CAPTCHA → Token pre-verified
3. Create Company → CAPTCHA token consumed ✓
4. Create First Admin User → CAPTCHA token NOT required ✓
```

## API Details

### Company Creation (CAPTCHA Required)
**POST** `/api/company`

**Request:**
```json
{
  "name": "Acme Schools",
  "email": "contact@acmeschools.com",
  "captchaToken": "550e8400-e29b-41d4-a716-446655440000",
  "captchaAnswer": "A3B7K"
}
```

✅ **CAPTCHA token is REQUIRED and will be consumed**

### First User Registration (CAPTCHA NOT Required)
**POST** `/api/auth/register`

**Request:**
```json
{
  "username": "admin_acme_schools",
  "email": "contact@acmeschools.com",
  "company_id": 30,
  "password": "optional_password"
}
```

✅ **CAPTCHA token is OPTIONAL and can be omitted**
✅ **No CAPTCHA validation will be performed for first user**

## Frontend Implementation

### TypeScript/JavaScript Example

```typescript
// Step 1: Create Company (requires CAPTCHA)
const createCompany = async (companyData: CompanyData, captchaToken: string, captchaAnswer: string) => {
  const response = await fetch('/api/company', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...companyData,
      captchaToken,
      captchaAnswer,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create company');
  }
  
  return await response.json();
};

// Step 2: Create First Admin User (NO CAPTCHA needed)
const createFirstAdminUser = async (companyId: number, companyName: string, companyEmail: string) => {
  // Generate username from company name
  const username = `admin_${companyName.toLowerCase().replace(/\s+/g, '_')}`;
  
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      email: companyEmail, // Use company email
      company_id: companyId,
      // NO captchaToken or captchaAnswer needed!
      password: undefined, // Optional - if not provided, user will get password setup email
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create admin user');
  }
  
  return await response.json();
};

// Complete flow
const registerCompanyAndAdmin = async (
  companyData: CompanyData,
  captchaToken: string,
  captchaAnswer: string
) => {
  try {
    // Step 1: Create company (consumes CAPTCHA token)
    const company = await createCompany(companyData, captchaToken, captchaAnswer);
    console.log('✅ Company created:', company);
    
    // Step 2: Create first admin user (NO CAPTCHA needed)
    const user = await createFirstAdminUser(
      company.id,
      company.name,
      company.email
    );
    console.log('✅ Admin user created:', user);
    
    return { company, user };
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};
```

### React Example

```typescript
const RegistrationPage = () => {
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    // ... other fields
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken || !captchaAnswer) {
      alert('Please complete the CAPTCHA');
      return;
    }

    try {
      // Step 1: Create company (requires CAPTCHA)
      const companyResponse = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...companyData,
          captchaToken,
          captchaAnswer,
        }),
      });

      if (!companyResponse.ok) {
        const error = await companyResponse.json();
        throw new Error(error.message || 'Failed to create company');
      }

      const company = await companyResponse.json();
      console.log('✅ Company created:', company);

      // Step 2: Create first admin user (NO CAPTCHA needed)
      const username = `admin_${company.name.toLowerCase().replace(/\s+/g, '_')}`;
      
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          email: company.email, // Use company email
          company_id: company.id,
          // Note: NO captchaToken or captchaAnswer here!
        }),
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.message || 'Failed to create admin user');
      }

      const user = await userResponse.json();
      console.log('✅ Admin user created:', user);

      alert('Company and admin user created successfully!');
    } catch (error: any) {
      alert(error.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Company form fields */}
      {/* CAPTCHA */}
      {/* Submit button */}
    </form>
  );
};
```

## Important Notes

### ✅ First User (Admin Created with Company)
- **CAPTCHA token**: NOT required
- **CAPTCHA answer**: NOT required
- **Validation**: Skipped automatically
- **Why**: CAPTCHA was already verified during company creation

### ⚠️ Subsequent Users (After First Admin)
- **CAPTCHA token**: REQUIRED
- **CAPTCHA answer**: Required if token not pre-verified
- **Validation**: Performed normally
- **Why**: These are new users being added to existing company

## Backend Behavior

The backend automatically detects if this is the first user:

```typescript
// Backend logic (src/auth/auth.service.ts)
const userCountForCompany = await usersService.countUsersByCompany(company_id);
const isFirstUserForCompany = userCountForCompany === 0;

if (isFirstUserForCompany) {
  // Skip CAPTCHA verification for first user
  console.log('✅ Skipping CAPTCHA verification for first user');
} else {
  // Verify CAPTCHA for subsequent users
  await captchaService.verifyCaptcha(captchaToken, captchaAnswer);
}
```

## Error Handling

### If Frontend Sends CAPTCHA for First User
- **Result**: Token is ignored, registration proceeds
- **No error**: Backend gracefully handles optional token
- **Best practice**: Don't send token for first user (cleaner code)

### If Frontend Omits CAPTCHA for Subsequent Users
- **Result**: `400 Bad Request - "CAPTCHA token is required for user registration"`
- **Solution**: Ensure CAPTCHA is included for non-first users

## Summary

| Scenario | CAPTCHA Required? | Token Sent? |
|----------|------------------|-------------|
| Company Creation | ✅ Yes | ✅ Yes (consumed) |
| First Admin User | ❌ No | ❌ No (optional) |
| Subsequent Users | ✅ Yes | ✅ Yes (required) |

## Frontend Checklist

When implementing company + admin registration:

- [ ] Generate and pre-verify CAPTCHA before company creation
- [ ] Send CAPTCHA token with company creation request
- [ ] After company creation, create admin user **WITHOUT** CAPTCHA token
- [ ] Generate username as `admin_{companyName}` (lowercase, underscores)
- [ ] Use company email for admin user email
- [ ] Handle errors separately for company and user creation
- [ ] Show success message only after both succeed

## Example: Complete Registration Flow

```typescript
// Complete registration example
async function registerCompanyWithAdmin(formData: CompanyFormData) {
  // 1. Generate CAPTCHA
  const captchaResponse = await fetch('/api/captcha/generate', { method: 'POST' });
  const captcha = await captchaResponse.json();
  
  // 2. User solves CAPTCHA in UI
  // ... (user enters answer)
  
  // 3. Pre-verify CAPTCHA
  await fetch('/api/captcha/pre-verify', {
    method: 'POST',
    body: JSON.stringify({
      token: captcha.token,
      answer: captchaAnswer,
    }),
  });
  
  // 4. Create Company (with CAPTCHA)
  const company = await fetch('/api/company', {
    method: 'POST',
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      captchaToken: captcha.token,
      captchaAnswer: captchaAnswer,
    }),
  });
  
  // 5. Create First Admin User (NO CAPTCHA)
  const adminUser = await fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: `admin_${formData.name.toLowerCase().replace(/\s+/g, '_')}`,
      email: formData.email,
      company_id: company.id,
      // ✅ NO CAPTCHA FIELDS HERE!
    }),
  });
  
  return { company, adminUser };
}
```

## Questions?

Refer to:
- `CAPTCHA_PREVERIFY_FLOW.md` - CAPTCHA implementation details
- `CAPTCHA_TROUBLESHOOTING.md` - Common issues and solutions
- `FIRST_ADMIN_SETUP.md` - Admin setup flow details
