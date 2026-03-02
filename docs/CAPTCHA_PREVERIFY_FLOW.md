# CAPTCHA Pre-Verify Flow Guide

## Problem Solved

Previously, when a user solved the CAPTCHA and then filled out the company registration form, the CAPTCHA token would expire before form submission. This caused validation errors like:
- "Invalid or expired CAPTCHA token"
- Users had to solve CAPTCHA again

**Important:** CAPTCHA tokens expire after **2 minutes** if not pre-verified. If you try to pre-verify after 2 minutes, you'll get an "Invalid or expired CAPTCHA token" error.

## Solution: Pre-Verify Flow

The new **pre-verify flow** allows you to verify the CAPTCHA answer immediately when the user solves it, then use the same token for form submission. The pre-verified token remains valid for **5 minutes**, giving users enough time to complete the form.

**Key Timing:**
- 🔴 **Original token**: Valid for **2 minutes** (must pre-verify within this time)
- ✅ **Pre-verified token**: Valid for **5 minutes** (after pre-verification)

---

## Flow Overview

```
1. Generate CAPTCHA → Get token + challenge
2. User solves CAPTCHA in UI
3. Pre-verify answer immediately → Token marked as "pre-verified" (valid 5 min)
4. User fills form
5. Submit form with pre-verified token → Token consumed, company created
```

---

## API Endpoints

### 1. Generate CAPTCHA
**POST** `/api/captcha/generate`

**Response:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "characters": "A3B7K",
  "charactersColumn": 2,
  "inputColumn": 4,
  "type": "grid"
}
```

### 2. Pre-Verify CAPTCHA (NEW)
**POST** `/api/captcha/pre-verify`

**Request:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "A3B7K"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "CAPTCHA pre-verified successfully. You can now submit your form with this token.",
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Error):**
```json
{
  "statusCode": 400,
  "message": "CAPTCHA verification failed. The characters you entered do not match. Please try again. (4 attempts remaining)",
  "error": "Bad Request"
}
```

### 3. Create Company
**POST** `/api/company`

**Request:**
```json
{
  "name": "Acme Schools",
  "email": "contact@acmeschools.com",
  "captchaToken": "550e8400-e29b-41d4-a716-446655440000",
  "captchaAnswer": "A3B7K"  // Optional if pre-verified, but recommended for backward compatibility
}
```

---

## Frontend Implementation

### React/TypeScript Example

```typescript
import { useState } from 'react';

interface CaptchaData {
  token: string;
  characters: string;
  charactersColumn: number;
  inputColumn: number;
  type: string;
}

const CompanyRegistrationForm = () => {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
  });

  // Step 1: Generate CAPTCHA on component mount
  const generateCaptcha = async () => {
    try {
      const response = await fetch('/api/captcha/generate', {
        method: 'POST',
      });
      const data = await response.json();
      setCaptcha(data);
      setCaptchaAnswer('');
      setIsCaptchaVerified(false);
    } catch (error) {
      console.error('Failed to generate CAPTCHA:', error);
      alert('Failed to load CAPTCHA. Please refresh the page.');
    }
  };

  // Step 2: Pre-verify CAPTCHA when user submits answer
  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captcha || !captchaAnswer) {
      alert('Please enter the CAPTCHA answer');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/captcha/pre-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: captcha.token,
          answer: captchaAnswer,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'CAPTCHA verification failed');
      }

      const result = await response.json();
      if (result.valid) {
        setIsCaptchaVerified(true);
        // Token is now pre-verified and valid for 5 minutes
        // User can now fill and submit the form
      }
    } catch (error: any) {
      alert(error.message || 'CAPTCHA verification failed. Please try again.');
      // Regenerate CAPTCHA on error
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Submit company registration form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCaptchaVerified || !captcha) {
      alert('Please verify the CAPTCHA first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          captchaToken: captcha.token,
          captchaAnswer: captchaAnswer, // Optional but recommended
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create company');
      }

      const result = await response.json();
      alert('Company created successfully!');
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        country: '',
      });
      generateCaptcha();
    } catch (error: any) {
      alert(error.message || 'Failed to create company. Please try again.');
      // If token expired, regenerate CAPTCHA
      if (error.message.includes('expired') || error.message.includes('Invalid')) {
        generateCaptcha();
        setIsCaptchaVerified(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate CAPTCHA on mount
  React.useEffect(() => {
    generateCaptcha();
  }, []);

  return (
    <div className="company-registration">
      <h2>Register Your Company</h2>
      
      {/* CAPTCHA Section */}
      <div className="captcha-section">
        <h3>Security Verification</h3>
        {captcha && (
          <div className="captcha-display">
            {/* Display CAPTCHA grid based on charactersColumn and inputColumn */}
            <p>Enter the characters shown in column {captcha.charactersColumn + 1}</p>
            {/* Render your CAPTCHA grid UI here */}
          </div>
        )}
        
        <form onSubmit={handleCaptchaSubmit}>
          <input
            type="text"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
            placeholder="Enter CAPTCHA"
            maxLength={5}
            disabled={isCaptchaVerified || isLoading}
          />
          <button 
            type="submit" 
            disabled={isCaptchaVerified || isLoading || !captchaAnswer}
          >
            {isLoading ? 'Verifying...' : isCaptchaVerified ? '✓ Verified' : 'Verify CAPTCHA'}
          </button>
        </form>
        
        {isCaptchaVerified && (
          <p className="success-message">
            ✓ CAPTCHA verified! You can now complete the form below.
          </p>
        )}
      </div>

      {/* Company Registration Form */}
      <form onSubmit={handleFormSubmit} className="company-form">
        <div>
          <label>Company Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={!isCaptchaVerified || isLoading}
          />
        </div>

        <div>
          <label>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!isCaptchaVerified || isLoading}
          />
        </div>

        <div>
          <label>Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isCaptchaVerified || isLoading}
          />
        </div>

        <div>
          <label>City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            disabled={!isCaptchaVerified || isLoading}
          />
        </div>

        <div>
          <label>Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            disabled={!isCaptchaVerified || isLoading}
          />
        </div>

        <button 
          type="submit" 
          disabled={!isCaptchaVerified || isLoading}
        >
          {isLoading ? 'Creating...' : 'Register Company'}
        </button>
      </form>
    </div>
  );
};
```

### Vue.js Example

```vue
<template>
  <div class="company-registration">
    <h2>Register Your Company</h2>
    
    <!-- CAPTCHA Section -->
    <div class="captcha-section">
      <h3>Security Verification</h3>
      
      <div v-if="captcha" class="captcha-display">
        <p>Enter the characters shown in column {{ captcha.charactersColumn + 1 }}</p>
        <!-- Render CAPTCHA grid UI -->
      </div>
      
      <form @submit.prevent="handleCaptchaSubmit">
        <input
          v-model="captchaAnswer"
          type="text"
          placeholder="Enter CAPTCHA"
          maxlength="5"
          :disabled="isCaptchaVerified || isLoading"
          @input="captchaAnswer = $event.target.value.toUpperCase()"
        />
        <button 
          type="submit" 
          :disabled="isCaptchaVerified || isLoading || !captchaAnswer"
        >
          {{ isLoading ? 'Verifying...' : isCaptchaVerified ? '✓ Verified' : 'Verify CAPTCHA' }}
        </button>
      </form>
      
      <p v-if="isCaptchaVerified" class="success-message">
        ✓ CAPTCHA verified! You can now complete the form below.
      </p>
    </div>

    <!-- Company Registration Form -->
    <form @submit.prevent="handleFormSubmit" class="company-form">
      <div>
        <label>Company Name *</label>
        <input
          v-model="formData.name"
          type="text"
          required
          :disabled="!isCaptchaVerified || isLoading"
        />
      </div>

      <div>
        <label>Email *</label>
        <input
          v-model="formData.email"
          type="email"
          required
          :disabled="!isCaptchaVerified || isLoading"
        />
      </div>

      <!-- Other form fields... -->

      <button 
        type="submit" 
        :disabled="!isCaptchaVerified || isLoading"
      >
        {{ isLoading ? 'Creating...' : 'Register Company' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface CaptchaData {
  token: string;
  characters: string;
  charactersColumn: number;
  inputColumn: number;
  type: string;
}

const captcha = ref<CaptchaData | null>(null);
const captchaAnswer = ref('');
const isCaptchaVerified = ref(false);
const isLoading = ref(false);
const formData = ref({
  name: '',
  email: '',
  phone: '',
  city: '',
  country: '',
});

const generateCaptcha = async () => {
  try {
    const response = await fetch('/api/captcha/generate', { method: 'POST' });
    const data = await response.json();
    captcha.value = data;
    captchaAnswer.value = '';
    isCaptchaVerified.value = false;
  } catch (error) {
    console.error('Failed to generate CAPTCHA:', error);
    alert('Failed to load CAPTCHA. Please refresh the page.');
  }
};

const handleCaptchaSubmit = async () => {
  if (!captcha.value || !captchaAnswer.value) {
    alert('Please enter the CAPTCHA answer');
    return;
  }

  isLoading.value = true;
  try {
    const response = await fetch('/api/captcha/pre-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: captcha.value.token,
        answer: captchaAnswer.value,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'CAPTCHA verification failed');
    }

    const result = await response.json();
    if (result.valid) {
      isCaptchaVerified.value = true;
    }
  } catch (error: any) {
    alert(error.message || 'CAPTCHA verification failed. Please try again.');
    generateCaptcha();
  } finally {
    isLoading.value = false;
  }
};

const handleFormSubmit = async () => {
  if (!isCaptchaVerified.value || !captcha.value) {
    alert('Please verify the CAPTCHA first');
    return;
  }

  isLoading.value = true;
  try {
    const response = await fetch('/api/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData.value,
        captchaToken: captcha.value.token,
        captchaAnswer: captchaAnswer.value,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create company');
    }

    alert('Company created successfully!');
    // Reset form
    formData.value = { name: '', email: '', phone: '', city: '', country: '' };
    generateCaptcha();
  } catch (error: any) {
    alert(error.message || 'Failed to create company. Please try again.');
    if (error.message.includes('expired') || error.message.includes('Invalid')) {
      generateCaptcha();
      isCaptchaVerified.value = false;
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  generateCaptcha();
});
</script>
```

---

## Key Points

### ✅ Best Practices

1. **Pre-verify immediately**: Call `/api/captcha/pre-verify` as soon as the user submits the CAPTCHA answer
2. **Disable form until verified**: Don't allow form submission until CAPTCHA is pre-verified
3. **Show verification status**: Display a clear indicator that CAPTCHA is verified
4. **Handle errors gracefully**: If pre-verification fails, regenerate CAPTCHA automatically
5. **Include answer in form**: Even though it's optional, include `captchaAnswer` in the form submission for backward compatibility

### ⚠️ Important Notes

- **Token lifetime**: 
  - Original token: **2 minutes** (must pre-verify within this window)
  - Pre-verified token: **5 minutes** (after pre-verification)
- **⏰ Timing is critical**: Pre-verify IMMEDIATELY after user solves CAPTCHA. If you wait more than 2 minutes, the token will expire.
- **One-time use**: Once the form is submitted, the token is consumed and cannot be reused
- **Error handling**: If token expires, regenerate CAPTCHA and ask user to verify again
- **Backward compatibility**: The old flow (verify + submit) still works but is not recommended for long forms

### 🐛 Common Issues

**"Invalid or expired CAPTCHA token" error:**
- **Cause**: More than 2 minutes passed between generating and pre-verifying the token
- **Solution**: Pre-verify immediately after the user solves the CAPTCHA, don't wait for form submission

### 🔄 Error Handling

```typescript
// Common error scenarios
try {
  await preVerifyCaptcha(token, answer);
} catch (error) {
  if (error.message.includes('expired')) {
    // Token expired - regenerate
    generateCaptcha();
  } else if (error.message.includes('attempts')) {
    // Too many failed attempts - regenerate
    generateCaptcha();
  } else if (error.message.includes('match')) {
    // Wrong answer - show error, keep same token
    showError(error.message);
  }
}
```

---

## Migration from Old Flow

If you're currently using the old flow (verify at form submission), here's what to change:

### Before (Old Flow)
```typescript
// Generate CAPTCHA
const captcha = await generateCaptcha();

// User fills form
// ...

// Submit form (verifies CAPTCHA here - might expire!)
await createCompany({ ...formData, captchaToken: captcha.token, captchaAnswer });
```

### After (New Flow)
```typescript
// Generate CAPTCHA
const captcha = await generateCaptcha();

// User solves CAPTCHA → Pre-verify immediately
await preVerifyCaptcha(captcha.token, captchaAnswer);
// ✓ Token is now pre-verified (valid 5 min)

// User fills form
// ...

// Submit form (token already verified, won't expire!)
await createCompany({ ...formData, captchaToken: captcha.token, captchaAnswer });
```

---

## Testing

1. Generate CAPTCHA
2. Pre-verify with correct answer → Should return `valid: true`
3. Wait 1-2 minutes
4. Submit form with pre-verified token → Should succeed
5. Try submitting again with same token → Should fail (token consumed)

---

## Special Case: First User Registration

**Important**: When creating the first admin user for a newly created company, CAPTCHA token is **NOT required** because the CAPTCHA was already verified during company creation.

```typescript
// ❌ WRONG - Don't send CAPTCHA for first user
await fetch('/api/auth/register', {
  body: JSON.stringify({
    username: 'admin_company_name',
    email: 'company@email.com',
    company_id: companyId,
    captchaToken: token, // ❌ Not needed!
  }),
});

// ✅ CORRECT - No CAPTCHA needed for first user
await fetch('/api/auth/register', {
  body: JSON.stringify({
    username: 'admin_company_name',
    email: 'company@email.com',
    company_id: companyId,
    // ✅ No CAPTCHA fields needed!
  }),
});
```

See `REGISTRATION_FLOW_NO_CAPTCHA.md` for complete details.

## Support

For questions or issues, refer to:
- `REGISTRATION_FLOW_NO_CAPTCHA.md` - First user registration without CAPTCHA
- `CAPTCHA_FRONTEND_GUIDE.md` - Complete CAPTCHA implementation guide
- `CAPTCHA_IMPLEMENTATION_DECISION.md` - Architecture decisions
