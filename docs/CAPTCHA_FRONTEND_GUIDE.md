# CAPTCHA Frontend Integration Guide

## Overview

This guide provides complete instructions for integrating the backend CAPTCHA system into your React frontend application.

**Important**: The backend uses a **grid-based alphanumeric CAPTCHA** with a 2-row × 5-column layout.

---

## Backend API Endpoints

### 1. Generate CAPTCHA
```
POST /api/captcha/generate
```

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

**Fields:**
- `token`: Unique token for verification
- `characters`: 5-character alphanumeric sequence (A-Z, 0-9)
- `charactersColumn`: Column index (0-4) where characters should be displayed in row 1
- `inputColumn`: Column index (0-4) where input field should be placed in row 2 (always different from charactersColumn)
- `type`: Always "grid"

### 2. Verify CAPTCHA
```
POST /api/captcha/verify
```

**Request Body:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "A3B7K"
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "message": "CAPTCHA verified successfully"
}
```

**Error Responses (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired CAPTCHA token"
}
// OR
{
  "statusCode": 400,
  "message": "CAPTCHA verification failed. The characters you entered do not match. Please try again. (4 attempts remaining)"
}
// OR
{
  "statusCode": 400,
  "message": "CAPTCHA token has expired"
}
// OR
{
  "statusCode": 400,
  "message": "CAPTCHA token has already been used"
}
// OR
{
  "statusCode": 400,
  "message": "Maximum verification attempts exceeded. Please generate a new CAPTCHA."
}
```

### 3. Validate Token (Optional)
```
GET /api/captcha/validate?token=550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "valid": true
}
```

---

## React Component Implementation

### Component Structure

```typescript
import React, { useState, useEffect } from 'react';

interface CaptchaData {
  token: string;
  characters: string;
  charactersColumn: number;
  inputColumn: number;
  type: string;
}

interface CaptchaProps {
  onVerify: (token: string, answer: string) => Promise<void>;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify, onError, disabled = false }) => {
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Generate CAPTCHA on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = async () => {
    try {
      setLoading(true);
      setError('');
      setUserInput(''); // Clear previous input

      const response = await fetch('/api/captcha/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate CAPTCHA');
      }

      const data: CaptchaData = await response.json();
      setCaptchaData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load CAPTCHA';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaData || !userInput.trim()) {
      setError('Please enter the characters shown above');
      return;
    }

    try {
      setIsVerifying(true);
      setError('');

      // Normalize input (uppercase, trim)
      const normalizedInput = userInput.trim().toUpperCase();

      await onVerify(captchaData.token, normalizedInput);
      
      // Success - parent component handles next steps
      // Optionally regenerate for next use
      generateCaptcha();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'CAPTCHA verification failed';
      setError(errorMessage);
      setUserInput(''); // Clear input on error
      
      // Regenerate CAPTCHA on failure
      generateCaptcha();
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefresh = () => {
    generateCaptcha();
  };

  const renderGrid = () => {
    if (!captchaData) return null;

    const grid = [];
    
    // Row 1: Display characters in the specified column
    const row1 = [];
    for (let col = 0; col < 5; col++) {
      if (col === captchaData.charactersColumn) {
        // Display characters in this column
        row1.push(
          <td 
            key={col} 
            className="captcha-characters-cell"
            aria-label={`Characters column ${col + 1}`}
          >
            <span className="captcha-characters">{captchaData.characters}</span>
          </td>
        );
      } else {
        // Empty cell
        row1.push(<td key={col} className="captcha-empty-cell"></td>);
      }
    }

    // Row 2: Display input field in the specified column
    const row2 = [];
    for (let col = 0; col < 5; col++) {
      if (col === captchaData.inputColumn) {
        // Display input field in this column
        row2.push(
          <td 
            key={col} 
            className="captcha-input-cell"
            aria-label={`Input column ${col + 1}`}
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              placeholder=""
              disabled={disabled || isVerifying}
              className="captcha-input"
              maxLength={5}
              required
              aria-label="Enter CAPTCHA characters"
              autoComplete="off"
            />
          </td>
        );
      } else {
        // Empty cell
        row2.push(<td key={col} className="captcha-empty-cell"></td>);
      }
    }

    return (
      <table className="captcha-grid" role="presentation">
        <tbody>
          <tr>{row1}</tr>
          <tr>{row2}</tr>
        </tbody>
      </table>
    );
  };

  if (loading) {
    return (
      <div className="captcha-loading">
        <p>Loading CAPTCHA...</p>
      </div>
    );
  }

  if (!captchaData) {
    return (
      <div className="captcha-error">
        <p>Failed to load CAPTCHA</p>
        <button onClick={generateCaptcha} type="button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="captcha-container">
      <div className="captcha-instruction">
        <p>Enter the characters shown above</p>
      </div>

      {renderGrid()}

      <form onSubmit={handleSubmit} className="captcha-form">
        <div className="captcha-actions">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={disabled || isVerifying}
            className="captcha-refresh"
            aria-label="Refresh CAPTCHA"
          >
            🔄 Refresh
          </button>
          <button
            type="submit"
            disabled={disabled || isVerifying || !userInput.trim()}
            className="captcha-submit"
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {error && (
          <div className="captcha-error-message" role="alert">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default Captcha;
```

---

## Integration with Registration Form

### Example: Registration Form with CAPTCHA

```typescript
import React, { useState } from 'react';
import Captcha from './components/Captcha';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  company_id: number;
  captchaToken: string;
  captchaAnswer: string;
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<Omit<RegisterFormData, 'captchaToken' | 'captchaAnswer'>>({
    username: '',
    email: '',
    password: '',
    company_id: 1,
  });
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [captchaAnswer, setCaptchaAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleCaptchaVerify = async (token: string, answer: string) => {
    // Store CAPTCHA data for form submission
    setCaptchaToken(token);
    setCaptchaAnswer(answer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken || captchaAnswer === null) {
      setError('Please complete the CAPTCHA');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const registerData: RegisterFormData = {
        ...formData,
        captchaToken,
        captchaAnswer,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('Registration successful:', result);
      
      // Handle success (redirect, show message, etc.)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      
      // Reset CAPTCHA on error
      setCaptchaToken('');
      setCaptchaAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={6}
        />
      </div>

      {/* CAPTCHA Component */}
      <Captcha
        onVerify={handleCaptchaVerify}
        onError={(err) => setError(err)}
        disabled={isSubmitting}
      />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <button type="submit" disabled={isSubmitting || !captchaToken}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;
```

---

## Integration with Company Creation Form

**⚠️ IMPORTANT**: When creating a company, **DO NOT** call `/api/captcha/verify` separately. Include `captchaToken` and `captchaAnswer` directly in your company creation request. The backend will verify the CAPTCHA automatically as part of the company creation process.

```typescript
interface CreateCompanyFormData {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  logo?: string;
  captchaToken: string;
  captchaAnswer: string;
}

const CreateCompanyForm: React.FC = () => {
  const [formData, setFormData] = useState<Omit<CreateCompanyFormData, 'captchaToken' | 'captchaAnswer'>>({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    logo: '',
  });
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [captchaAnswer, setCaptchaAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleCaptchaVerify = async (token: string, answer: string) => {
    // Store CAPTCHA data for form submission
    // NOTE: Do NOT call /api/captcha/verify here!
    // The backend will verify when you submit the company creation request
    setCaptchaToken(token);
    setCaptchaAnswer(answer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken || captchaAnswer === null) {
      setError('Please complete the CAPTCHA');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const companyData: CreateCompanyFormData = {
        ...formData,
        captchaToken,
        captchaAnswer,
      };

      // Include CAPTCHA fields directly in the company creation request
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle CAPTCHA-specific errors
        if (errorData.message && Array.isArray(errorData.message)) {
          const captchaErrors = errorData.message.filter((msg: string) => 
            msg.toLowerCase().includes('captcha')
          );
          if (captchaErrors.length > 0) {
            throw new Error('CAPTCHA verification failed. Please regenerate and try again.');
          }
        }
        throw new Error(errorData.message || 'Company creation failed');
      }

      const result = await response.json();
      console.log('Company created successfully:', result);
      
      // Handle success (redirect, show message, etc.)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Company creation failed';
      setError(errorMessage);
      
      // Reset CAPTCHA on error - user will need to solve a new one
      setCaptchaToken('');
      setCaptchaAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="company-form">
      <div className="form-group">
        <label htmlFor="name">Company Name</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone (Optional)</label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="city">City (Optional)</label>
        <input
          type="text"
          id="city"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="country">Country (Optional)</label>
        <input
          type="text"
          id="country"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        />
      </div>

      {/* CAPTCHA Component */}
      <CaptchaGrid
        onVerify={handleCaptchaVerify}
        onError={(err) => setError(err)}
        disabled={isSubmitting}
      />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <button type="submit" disabled={isSubmitting || !captchaToken}>
        {isSubmitting ? 'Creating Company...' : 'Create Company'}
      </button>
    </form>
  );
};

export default CreateCompanyForm;
```

**Key Points:**
- ✅ Include `captchaToken` and `captchaAnswer` in the company creation request body
- ✅ Let the backend verify the CAPTCHA automatically
- ❌ **DO NOT** call `/api/captcha/verify` separately before creating the company
- ❌ Calling `/api/captcha/verify` first will consume the token, making company creation fail

---

## Integration with Forgot Password Form

```typescript
const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [captchaAnswer, setCaptchaAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleCaptchaVerify = async (token: string, answer: string) => {
    setCaptchaToken(token);
    setCaptchaAnswer(answer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken || captchaAnswer === null) {
      setError('Please complete the CAPTCHA');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          captchaToken,
          captchaAnswer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
      }

      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      setCaptchaToken('');
      setCaptchaAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <p>Password reset link has been sent to your email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Captcha
        onVerify={handleCaptchaVerify}
        onError={(err) => setError(err)}
        disabled={isSubmitting}
      />

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={isSubmitting || !captchaToken}>
        Send Reset Link
      </button>
    </form>
  );
};
```

---

## CSS Styling (Tailwind Example)

```css
/* captcha.css or Tailwind classes */

.captcha-container {
  @apply p-4 border border-gray-300 rounded-lg bg-gray-50;
}

.captcha-instruction {
  @apply text-sm text-gray-600 mb-3 text-center;
}

.captcha-grid {
  @apply w-full border-collapse mb-4;
}

.captcha-grid td {
  @apply border border-gray-300 p-3 text-center;
  min-width: 80px;
  height: 60px;
}

.captcha-characters-cell {
  @apply bg-blue-50 border-blue-300;
}

.captcha-characters {
  @apply text-2xl font-bold text-gray-800 tracking-wider;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.2em;
}

.captcha-input-cell {
  @apply bg-yellow-50 border-yellow-300;
}

.captcha-input {
  @apply w-full px-2 py-1 text-center text-lg font-semibold border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.captcha-input:disabled {
  @apply bg-gray-100 cursor-not-allowed;
}

.captcha-empty-cell {
  @apply bg-gray-100;
}

.captcha-form {
  @apply space-y-3;
}

.captcha-actions {
  @apply flex gap-2 justify-center;
}

.captcha-refresh {
  @apply px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.captcha-submit {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.captcha-error-message {
  @apply text-sm text-red-600 bg-red-50 p-2 rounded text-center;
}

.captcha-loading {
  @apply p-4 text-center text-gray-600;
}

.captcha-error {
  @apply p-4 text-center text-red-600;
}
```

---

## Key Implementation Points

### ✅ DO:

1. **Generate CAPTCHA on component mount** - Always fetch a new CAPTCHA when the component loads
2. **Store token and answer in component state** - Keep them until form submission
3. **Display characters in the specified column** - Use `charactersColumn` from backend response
4. **Place input in the specified column** - Use `inputColumn` from backend response (different from charactersColumn)
5. **Clear input on error** - Reset the input field when verification fails
6. **Regenerate on failure** - Automatically fetch a new CAPTCHA after failed verification
7. **Normalize input to uppercase** - Backend comparison is case-insensitive, but normalize for consistency
8. **Handle all error cases** - Display user-friendly error messages
9. **Disable form during submission** - Prevent multiple submissions
10. **Use text input with maxLength=5** - Limit input to 5 characters

### ❌ DON'T:

1. **Don't validate CAPTCHA on frontend** - Backend is the single source of truth
2. **Don't store CAPTCHA in localStorage/sessionStorage** - Keep it in component state only
3. **Don't hard-code CAPTCHA values** - Always fetch from backend
4. **Don't skip CAPTCHA on retry** - Always regenerate after errors
5. **Don't cache CAPTCHA tokens** - Each form submission needs a fresh CAPTCHA
6. **Don't show characters in wrong column** - Use the exact `charactersColumn` from backend
7. **Don't place input in wrong column** - Use the exact `inputColumn` from backend

---

## Error Handling

### Common Error Scenarios

1. **"Invalid or expired CAPTCHA token"**
   - Solution: Regenerate CAPTCHA automatically

2. **"CAPTCHA token has expired"**
   - Solution: Show message, regenerate CAPTCHA

3. **"CAPTCHA token has already been used"**
   - Solution: User tried to reuse token, regenerate CAPTCHA

4. **"CAPTCHA verification failed. The characters you entered do not match. Please try again. (X attempts remaining)"**
   - Solution: Clear input, show error, allow retry (token still valid for retries)
   - The message includes remaining attempts to help users understand how many chances they have left

5. **"Maximum verification attempts exceeded"**
   - Solution: Regenerate CAPTCHA, user must solve new one

6. **Company/Registration creation fails with "CAPTCHA token is required" errors**
   - **Cause**: You called `/api/captcha/verify` separately before submitting the form, which consumed/deleted the token
   - **Solution**: **DO NOT** call `/api/captcha/verify` separately. Include `captchaToken` and `captchaAnswer` directly in your company/registration creation request. The backend will verify automatically.
   - **Correct flow**: Generate CAPTCHA → User solves → Submit form with `captchaToken` and `captchaAnswer` included → Backend verifies automatically
   - **Incorrect flow**: Generate CAPTCHA → User solves → Call `/api/captcha/verify` (consumes token) → Submit form → **FAILS** because token was already consumed

---

## Security Best Practices

1. **Never validate CAPTCHA on frontend** - All validation happens on backend
2. **Don't expose CAPTCHA answer in client-side code** - Answer is only sent to backend
3. **Use HTTPS** - Always use secure connections in production
4. **Handle errors gracefully** - Don't expose internal error details to users
5. **Regenerate on every error** - Fresh CAPTCHA after any failure
6. **Auto-uppercase input** - Normalize user input to match backend comparison

---

## Testing Checklist

- [ ] CAPTCHA loads on component mount
- [ ] Grid displays correctly (2 rows × 5 columns)
- [ ] Characters appear in the correct column (row 1)
- [ ] Input field appears in the correct column (row 2)
- [ ] Characters column and input column are different
- [ ] User can enter alphanumeric characters
- [ ] Input is automatically converted to uppercase
- [ ] Form submission includes CAPTCHA token and answer
- [ ] Error messages display correctly
- [ ] CAPTCHA regenerates on error
- [ ] Input clears on failed verification
- [ ] Component is disabled during submission
- [ ] Works on mobile devices
- [ ] Keyboard accessible
- [ ] Refresh button works
- [ ] Handles network errors gracefully
- [ ] Grid is visually clear and readable

---

## API Base URL Configuration

Make sure to configure your API base URL:

```typescript
// config.ts or .env
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// In your fetch calls:
const response = await fetch(`${API_BASE_URL}/api/captcha/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## Visual Example

The CAPTCHA grid should look like this:

```
Row 1: [  ] [  ] [A3B7K] [  ] [  ]
Row 2: [  ] [  ] [  ] [  ] [____]
```

Where:
- `A3B7K` is displayed in column 2 (charactersColumn = 2)
- Input field is in column 4 (inputColumn = 4)
- All other cells are empty

---

## Summary

- **Backend provides**: 5-character alphanumeric sequence + column positions
- **Frontend displays**: 2×5 grid with characters in one column, input in another
- **User enters**: The 5 characters shown in row 1
- **Frontend sends**: Token + answer (uppercase string) to backend
- **Backend validates**: Everything (expiration, correctness, single-use, case-insensitive)
- **Frontend handles**: Display, user input, error messages, regeneration

The frontend is **display-only** - all security and validation logic is handled by the backend.
