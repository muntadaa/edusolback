# CAPTCHA Troubleshooting Guide

## Common Error Messages and Solutions

### 1. "Invalid or expired CAPTCHA token" on Pre-Verify

**Possible Causes:**

#### Cause A: Token Expired Before Pre-Verification
- **Symptom**: Token was generated more than 2 minutes ago
- **Solution**: 
  - Generate CAPTCHA and pre-verify immediately (within 2 minutes)
  - Check for network delays between generate and pre-verify calls
  - Add timestamp logging to track timing

#### Cause B: Server Restart
- **Symptom**: Server was restarted, clearing in-memory cache
- **Solution**: 
  - All active tokens become invalid after server restart
  - Users need to generate new CAPTCHA after server restart
  - Consider implementing persistent cache (Redis) for production

#### Cause C: Token Never Generated
- **Symptom**: Frontend trying to use a token that doesn't exist
- **Solution**:
  - Verify token is properly stored after generation
  - Check network errors during CAPTCHA generation
  - Ensure token is passed correctly to pre-verify endpoint

#### Cause D: Cache Eviction
- **Symptom**: Very high traffic causing cache to evict tokens
- **Solution**: 
  - Current limit is 10,000 tokens (should be sufficient)
  - Monitor cache usage
  - Increase `max` value in `captcha.module.ts` if needed

### 2. "Invalid or expired CAPTCHA token" on Form Submission

**Possible Causes:**

#### Cause A: Token Not Pre-Verified
- **Symptom**: Form submitted without pre-verifying token first
- **Solution**: Always pre-verify token before form submission

#### Cause B: Pre-Verified Token Expired
- **Symptom**: More than 5 minutes passed after pre-verification
- **Solution**: 
  - Pre-verified tokens are valid for 5 minutes
  - If user takes longer, regenerate CAPTCHA
  - Consider adding client-side expiration warnings

#### Cause C: Token Already Used
- **Symptom**: Same token used for multiple submissions
- **Solution**: Tokens are single-use, generate new CAPTCHA for each submission

### 3. "CAPTCHA token is required" / "CAPTCHA token must be a string"

**Cause**: Token not included in request body

**Solution**:
- Verify token is being sent in request payload
- Check frontend code includes `captchaToken` field
- Verify token is stored after generation and not lost between steps

## Debugging Steps

### Step 1: Verify Token Generation
```typescript
// Check if token is received
const captcha = await generateCaptcha();
console.log('Generated token:', captcha.token);
// Should be a valid UUID format
```

### Step 2: Verify Pre-Verify Timing
```typescript
const startTime = Date.now();
const captcha = await generateCaptcha();
console.log('Generation time:', startTime);

// User solves CAPTCHA...

const preVerifyTime = Date.now();
const elapsed = (preVerifyTime - startTime) / 1000;
console.log('Time before pre-verify:', elapsed, 'seconds');
// Should be less than 120 seconds (2 minutes)

await preVerifyCaptcha(captcha.token, answer);
```

### Step 3: Check Network Timing
- Use browser DevTools Network tab to check timing between requests
- Look for delays between `/api/captcha/generate` and `/api/captcha/pre-verify`
- Check for network errors or retries

### Step 4: Verify Server State
- Check if server was restarted (clears in-memory cache)
- Monitor server logs for cache-related errors
- Verify cache module is properly initialized

## Best Practices to Avoid Issues

### Frontend
1. **Generate CAPTCHA on-demand**: Generate only when user needs to solve it
2. **Pre-verify immediately**: Call pre-verify as soon as user submits CAPTCHA answer
3. **Store token securely**: Keep token in component state, not just in DOM
4. **Handle errors gracefully**: Regenerate CAPTCHA on any error
5. **Add timeout warnings**: Warn users if they're taking too long

### Backend
1. **Monitor cache**: Track cache hit/miss rates
2. **Log errors**: Log token lookup failures for debugging
3. **Consider persistent cache**: Use Redis in production for persistence
4. **Set appropriate TTLs**: Balance security (short TTL) vs UX (long enough for completion)

## Production Recommendations

### Use Redis for Cache (Persistent Storage)

```typescript
// captcha.module.ts
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 300, // 5 minutes
      max: 10000,
    }),
  ],
  // ...
})
```

**Benefits:**
- Tokens survive server restarts
- Better for multi-server deployments
- More reliable in production
- Can add Redis monitoring/alerting

### Add Token Validation Endpoint

For debugging, add an endpoint to check token status:

```typescript
@Get('token-status/:token')
async getTokenStatus(@Param('token') token: string) {
  const data = await this.captchaService.validateToken(token);
  const fullData = await this.cacheManager.get<CaptchaData>(token);
  
  return {
    exists: !!fullData,
    valid: data,
    details: fullData ? {
      expiresAt: fullData.expiresAt,
      preVerified: fullData.preVerified,
      used: fullData.used,
      attempts: fullData.attempts,
      timeRemaining: Math.max(0, fullData.expiresAt.getTime() - Date.now()),
    } : null,
  };
}
```

## Monitoring

### Key Metrics to Track
1. **Token generation rate**: CAPTCHAs generated per minute
2. **Pre-verify success rate**: Successful pre-verifications / total attempts
3. **Token expiration rate**: Tokens expired before pre-verification
4. **Average time to pre-verify**: Time between generation and pre-verification
5. **Form submission success rate**: Successful submissions with pre-verified tokens

### Logging Recommendations
- Log all token generation with timestamp
- Log pre-verification attempts with timing
- Log token lookup failures
- Log cache evictions if they occur

## Quick Fix Checklist

When users report CAPTCHA issues:

- [ ] Verify token format (should be UUID)
- [ ] Check timing: Was token generated < 2 minutes ago?
- [ ] Check if server was restarted recently
- [ ] Verify token is included in request body
- [ ] Check network tab for request failures
- [ ] Verify pre-verify was called before form submission
- [ ] Check if token was already used
- [ ] Verify cache is functioning (check logs)
