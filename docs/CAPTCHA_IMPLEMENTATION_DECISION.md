# CAPTCHA Implementation Decision

## Executive Summary

**Decision: NO database table or entity is required for the CAPTCHA system.**

The CAPTCHA should be implemented using **in-memory storage** (Map or NestJS CacheModule) with a dedicated `CaptchaModule` and `CaptchaService`.

---

## Decision: Database Table Not Needed

### Justification

1. **Temporary Nature**: CAPTCHA tokens expire in 1-2 minutes and are single-use. This matches the pattern already used in the codebase for password reset tokens (JWT-based, not stored in database).

2. **Performance**: In-memory storage provides:
   - **Sub-millisecond lookups** vs database query latency
   - **No database connection overhead** for high-frequency verification requests
   - **Automatic cleanup** on application restart (no stale data)

3. **Scalability**: For a single-instance deployment, in-memory storage is sufficient. If horizontal scaling is needed later, Redis can be added without changing the service interface.

4. **Existing Pattern**: The application already uses JWT tokens for temporary verification (password reset) without database persistence. CAPTCHA follows the same pattern.

5. **Resource Efficiency**: 
   - No database table maintenance
   - No migration scripts
   - No cleanup jobs for expired entries
   - Minimal memory footprint (tokens auto-expire)

6. **Security**: In-memory storage is actually more secure for temporary data:
   - Data is lost on restart (prevents token reuse after incidents)
   - No persistent attack surface
   - Faster invalidation

---

## Recommended NestJS Structure

### Architecture Overview

```
src/
  captcha/
    ├── captcha.module.ts          # Module definition
    ├── captcha.service.ts          # Core CAPTCHA logic
    ├── captcha.controller.ts       # API endpoints
    ├── dto/
    │   ├── generate-captcha.dto.ts
    │   └── verify-captcha.dto.ts
    └── interfaces/
        └── captcha-data.interface.ts
```

### Implementation Approach

**Option 1: Simple In-Memory Map (Recommended for MVP)**
- Use a `Map<string, CaptchaData>` in the service
- Periodic cleanup via `setInterval` or on-demand during verification
- **Pros**: Zero dependencies, simple, fast
- **Cons**: Lost on restart (acceptable for CAPTCHA)

**Option 2: NestJS CacheModule (Recommended for Production)**
- Use `@nestjs/cache-manager` with memory store
- Built-in TTL support
- **Pros**: Standard NestJS pattern, automatic expiration, extensible to Redis later
- **Cons**: Requires additional dependency

---

## Detailed Structure

### 1. CaptchaModule

```typescript
@Module({
  imports: [
    CacheModule.register({
      ttl: 120, // 2 minutes in seconds
      max: 10000, // Maximum number of CAPTCHAs in memory
    }),
  ],
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService], // Export for use in AuthModule
})
export class CaptchaModule {}
```

### 2. CaptchaService

**Responsibilities:**
- Generate CAPTCHA challenge (e.g., math problem, image challenge)
- Store challenge with unique token
- Verify user response
- Cleanup expired entries

**Storage Structure:**
```typescript
interface CaptchaData {
  answer: string | number;
  expiresAt: Date;
  used: boolean;
  attempts: number; // Optional: rate limiting
}
```

**Key Methods:**
- `generateCaptcha(): { token: string, challenge: string }`
- `verifyCaptcha(token: string, answer: string): boolean`
- `cleanupExpired(): void` (optional, for manual cleanup)

### 3. CaptchaController

**Endpoints:**
- `POST /api/captcha/generate` - Generate new CAPTCHA
- `POST /api/captcha/verify` - Verify CAPTCHA response

### 4. Integration with AuthModule

The `CaptchaService` should be imported into `AuthModule` and used in:
- Registration endpoint (`/auth/register`)
- Password reset endpoint (`/auth/forgot-password`)
- Any other critical actions requiring human verification

**Example Guard:**
```typescript
@UseGuards(CaptchaGuard)
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  // Registration logic
}
```

---

## Implementation Details

### Storage Key Strategy

Use a cryptographically secure random token (e.g., `crypto.randomUUID()`) as the key:
- **Format**: `uuid-v4` or `base64url` encoded random bytes
- **Length**: 32+ characters
- **Uniqueness**: Guaranteed by UUID or sufficient entropy

### Expiration Handling

1. **Automatic**: CacheModule TTL automatically removes expired entries
2. **Manual**: Check `expiresAt` during verification
3. **Cleanup**: Optional background job to remove expired entries periodically

### Single-Use Enforcement

```typescript
async verifyCaptcha(token: string, answer: string): boolean {
  const captchaData = await this.cacheManager.get<CaptchaData>(token);
  
  if (!captchaData || captchaData.used) {
    throw new BadRequestException('Invalid or already used CAPTCHA token');
  }
  
  if (new Date() > captchaData.expiresAt) {
    await this.cacheManager.del(token);
    throw new BadRequestException('CAPTCHA expired');
  }
  
  const isValid = captchaData.answer === answer;
  
  if (isValid) {
    // Mark as used and delete
    await this.cacheManager.del(token);
  }
  
  return isValid;
}
```

### Rate Limiting (Optional)

Store attempt count in `CaptchaData`:
- Limit to 3-5 attempts per token
- Block token after max attempts
- Prevents brute force attacks

---

## Alternative: Redis (Future Scalability)

If horizontal scaling is required:

1. **Install**: `@nestjs/cache-manager` + `cache-manager-redis-store`
2. **Change**: Only the `CacheModule.register()` configuration
3. **Service code**: Remains unchanged (abstraction benefit)

```typescript
CacheModule.register({
  store: redisStore,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  ttl: 120,
})
```

---

## Security Considerations

1. **Token Generation**: Use cryptographically secure random tokens
2. **Answer Storage**: Store hashed answers if sensitive (optional)
3. **Rate Limiting**: Implement per-IP or per-token attempt limits
4. **Challenge Complexity**: Ensure CAPTCHA is not easily solvable by bots
5. **Token Validation**: Always verify token exists and is not expired/used

---

## Testing Strategy

1. **Unit Tests**: Test service methods (generate, verify, cleanup)
2. **Integration Tests**: Test controller endpoints
3. **E2E Tests**: Test full flow (generate → verify → use in registration)

---

## Migration Path (If Database Needed Later)

If requirements change and persistence is needed:

1. Create `Captcha` entity with TypeORM
2. Replace `CacheManager` with `Repository<Captcha>`
3. Service interface remains the same (minimal code changes)
4. Add migration script

**However, this is unlikely to be necessary** given the temporary nature of CAPTCHA.

---

## Summary for Team Lead

**Question**: Do we need a database table for CAPTCHA?

**Answer**: **No, we do not need a database table.**

**Reasoning**:
- CAPTCHA tokens are temporary (1-2 min expiration) and single-use
- In-memory storage is faster, simpler, and follows existing patterns (password reset uses JWT, not DB)
- No persistence needed across restarts
- Can scale to Redis later if needed without code changes

**Implementation**:
- Create `CaptchaModule` with `CaptchaService`
- Use NestJS `CacheModule` with in-memory store (or simple Map for MVP)
- Integrate with `AuthModule` for registration/password reset
- Zero database changes required

**Estimated Effort**: 4-6 hours (module, service, controller, DTOs, tests, integration)

---

## Conclusion

A database table is **unnecessary and counterproductive** for this use case. The recommended in-memory approach is:
- ✅ Simpler to implement
- ✅ Faster performance
- ✅ Lower resource usage
- ✅ Aligns with existing codebase patterns
- ✅ Easily extensible to Redis if needed

Proceed with `CaptchaModule` + in-memory storage.
