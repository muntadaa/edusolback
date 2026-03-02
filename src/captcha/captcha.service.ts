import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { CaptchaData } from './interfaces/captcha-data.interface';

@Injectable()
export class CaptchaService {
  private readonly CAPTCHA_TTL = 120; // 2 minutes in seconds
  private readonly PRE_VERIFIED_TTL = 300; // 5 minutes for pre-verified tokens (for form submission)
  private readonly MAX_ATTEMPTS = 5;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Generate random alphanumeric character (A-Z, 0-9)
   */
  private generateRandomChar(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  /**
   * Generate a new CAPTCHA challenge with grid layout
   * @returns Object containing token, characters, column positions, and type
   */
  async generateCaptcha(): Promise<{
    token: string;
    characters: string;
    charactersColumn: number;
    inputColumn: number;
    type: string;
  }> {
    // Generate 5 random alphanumeric characters
    const characters = Array.from({ length: 5 }, () => this.generateRandomChar()).join('');

    // Randomly select column for characters (0-4)
    const charactersColumn = Math.floor(Math.random() * 5);

    // Randomly select column for input (0-4, must be different from charactersColumn)
    let inputColumn = Math.floor(Math.random() * 5);
    while (inputColumn === charactersColumn) {
      inputColumn = Math.floor(Math.random() * 5);
    }

    // Generate unique token
    const token = randomUUID();

    // Create CAPTCHA data
    const captchaData: CaptchaData = {
      answer: characters, // Store the characters as the answer
      expiresAt: new Date(Date.now() + this.CAPTCHA_TTL * 1000),
      used: false,
      preVerified: false,
      attempts: 0,
      createdAt: new Date(),
    };

    // Store in cache with TTL
    await this.cacheManager.set(token, captchaData, this.CAPTCHA_TTL * 1000);

    return {
      token,
      characters,
      charactersColumn,
      inputColumn,
      type: 'grid',
    };
  }

  /**
   * Pre-verify CAPTCHA answer without consuming the token
   * This allows the frontend to verify the answer immediately and then use the token for form submission
   * @param token CAPTCHA token
   * @param answer User's answer
   * @returns true if valid, throws exception if invalid
   */
  async preVerifyCaptcha(token: string, answer: string | number): Promise<boolean> {
    // Get token from cache
    const captchaData = await this.cacheManager.get<CaptchaData>(token);

    // Check if token exists
    if (!captchaData) {
      // Check if token format is valid (basic validation)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) {
        throw new BadRequestException(
          'Invalid CAPTCHA token format. The token must be a valid UUID. Please generate a new CAPTCHA.'
        );
      }
      
      throw new BadRequestException(
        'Invalid or expired CAPTCHA token. The token may have expired (tokens are valid for 2 minutes) or was never generated. Possible causes: 1) Token expired before pre-verification (more than 2 minutes passed), 2) Server was restarted (in-memory cache cleared), 3) Token was never generated. Please generate a new CAPTCHA.'
      );
    }

    // Check if already used
    if (captchaData.used) {
      await this.cacheManager.del(token);
      throw new BadRequestException('CAPTCHA token has already been used');
    }

    // Check if expired
    if (new Date() > captchaData.expiresAt) {
      await this.cacheManager.del(token);
      const expiredSeconds = Math.floor((new Date().getTime() - captchaData.expiresAt.getTime()) / 1000);
      throw new BadRequestException(
        `CAPTCHA token has expired. Token expired ${expiredSeconds} second${expiredSeconds !== 1 ? 's' : ''} ago. Please generate a new CAPTCHA.`
      );
    }

    // Normalize answer comparison (case-insensitive for alphanumeric CAPTCHA)
    const normalizedAnswer = typeof answer === 'number' 
      ? answer.toString().trim().toUpperCase()
      : answer.trim().toUpperCase();
    const normalizedExpected = captchaData.answer.toString().trim().toUpperCase();

    const isValid = normalizedAnswer === normalizedExpected;

    // If already pre-verified with correct answer, just extend the expiration
    if (captchaData.preVerified && isValid) {
      captchaData.expiresAt = new Date(Date.now() + this.PRE_VERIFIED_TTL * 1000);
      await this.cacheManager.set(token, captchaData, this.PRE_VERIFIED_TTL * 1000);
      return true;
    }

    // Check attempt limit
    if (captchaData.attempts >= this.MAX_ATTEMPTS) {
      await this.cacheManager.del(token);
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please generate a new CAPTCHA.',
      );
    }

    // Increment attempts
    captchaData.attempts += 1;

    if (isValid) {
      // Mark as pre-verified, extend expiration for form submission, but DON'T delete
      captchaData.preVerified = true;
      captchaData.expiresAt = new Date(Date.now() + this.PRE_VERIFIED_TTL * 1000);
      await this.cacheManager.set(token, captchaData, this.PRE_VERIFIED_TTL * 1000);
      
      // Verify the token was stored correctly
      const verifyData = await this.cacheManager.get<CaptchaData>(token);
      console.log('[CAPTCHA preVerifyCaptcha] Token stored:', {
        token: token.substring(0, 8) + '...',
        preVerified: verifyData?.preVerified,
        expiresAt: verifyData?.expiresAt,
        stored: !!verifyData,
      });
      
      return true;
    } else {
      // Update attempts in cache
      await this.cacheManager.set(token, captchaData, this.CAPTCHA_TTL * 1000);
      const remainingAttempts = this.MAX_ATTEMPTS - captchaData.attempts;
      throw new BadRequestException(
        `CAPTCHA verification failed. The characters you entered do not match. Please try again. ${remainingAttempts > 0 ? `(${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining)` : ''}`,
      );
    }
  }

  /**
   * Verify CAPTCHA answer (consumes the token)
   * If checkPreVerified is true, checks if token was pre-verified and just marks as used
   * Otherwise, verifies the answer normally
   * @param token CAPTCHA token
   * @param answer User's answer (optional if checkPreVerified is true)
   * @param checkPreVerified If true, only checks if token was pre-verified
   * @returns true if valid, throws exception if invalid
   */
  async verifyCaptcha(
    token: string, 
    answer?: string | number, 
    checkPreVerified: boolean = false
  ): Promise<boolean> {
    const captchaData = await this.cacheManager.get<CaptchaData>(token);

    // Debug logging
    console.log('[CAPTCHA verifyCaptcha]', {
      token: token.substring(0, 8) + '...',
      checkPreVerified,
      hasAnswer: !!answer,
      tokenExists: !!captchaData,
      tokenData: captchaData ? {
        preVerified: captchaData.preVerified,
        used: captchaData.used,
        expired: new Date() > captchaData.expiresAt,
        expiresAt: captchaData.expiresAt,
        attempts: captchaData.attempts,
      } : null,
    });

    // Check if token exists
    if (!captchaData) {
      if (checkPreVerified) {
        throw new BadRequestException(
          'CAPTCHA token has not been pre-verified or has expired. Please pre-verify the token first using /api/captcha/pre-verify, or the token may have expired (pre-verified tokens are valid for 5 minutes).'
        );
      }
      throw new BadRequestException(
        'Invalid or expired CAPTCHA token. The token may have expired (tokens are valid for 2 minutes, pre-verified tokens for 5 minutes) or was never generated. Possible causes: 1) Token expired, 2) Server was restarted (in-memory cache cleared), 3) Token was never generated. Please generate a new CAPTCHA.'
      );
    }

    // Check if already used
    if (captchaData.used) {
      await this.cacheManager.del(token);
      throw new BadRequestException('CAPTCHA token has already been used');
    }

    // Check if expired
    if (new Date() > captchaData.expiresAt) {
      await this.cacheManager.del(token);
      throw new BadRequestException('CAPTCHA token has expired');
    }

    // If checking pre-verified token
    if (checkPreVerified) {
      if (captchaData.preVerified) {
        // Mark as used and delete
        captchaData.used = true;
        await this.cacheManager.del(token);
        return true;
      } else {
        throw new BadRequestException('CAPTCHA token has not been pre-verified');
      }
    }

    // Normal verification flow
    if (!answer) {
      throw new BadRequestException('CAPTCHA answer is required');
    }

    // Check attempt limit
    if (captchaData.attempts >= this.MAX_ATTEMPTS) {
      await this.cacheManager.del(token);
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please generate a new CAPTCHA.',
      );
    }

    // Increment attempts
    captchaData.attempts += 1;

    // Normalize answer comparison (case-insensitive for alphanumeric CAPTCHA)
    const normalizedAnswer = typeof answer === 'number' 
      ? answer.toString().trim().toUpperCase()
      : answer.trim().toUpperCase();
    const normalizedExpected = captchaData.answer.toString().trim().toUpperCase();

    const isValid = normalizedAnswer === normalizedExpected;

    if (isValid) {
      // Mark as used and delete
      captchaData.used = true;
      await this.cacheManager.del(token);
      return true;
    } else {
      // Update attempts in cache
      await this.cacheManager.set(token, captchaData, this.CAPTCHA_TTL * 1000);
      const remainingAttempts = this.MAX_ATTEMPTS - captchaData.attempts;
      throw new BadRequestException(
        `CAPTCHA verification failed. The characters you entered do not match. Please try again. ${remainingAttempts > 0 ? `(${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining)` : ''}`,
      );
    }
  }

  /**
   * Validate CAPTCHA token without consuming it
   * Useful for checking if token is still valid before form submission
   * @param token CAPTCHA token
   * @returns true if token is valid and not expired
   */
  async validateToken(token: string): Promise<boolean> {
    const captchaData = await this.cacheManager.get<CaptchaData>(token);

    if (!captchaData) {
      return false;
    }

    if (captchaData.used) {
      return false;
    }

    if (new Date() > captchaData.expiresAt) {
      await this.cacheManager.del(token);
      return false;
    }

    return true;
  }

  /**
   * Get detailed token status for debugging
   * @param token CAPTCHA token
   * @returns Token status details
   */
  async getTokenStatus(token: string): Promise<any> {
    const captchaData = await this.cacheManager.get<CaptchaData>(token);
    const now = new Date();
    
    return {
      token: token.substring(0, 8) + '...',
      exists: !!captchaData,
      details: captchaData ? {
        preVerified: captchaData.preVerified,
        used: captchaData.used,
        attempts: captchaData.attempts,
        createdAt: captchaData.createdAt,
        expiresAt: captchaData.expiresAt,
        isExpired: now > captchaData.expiresAt,
        timeRemaining: Math.max(0, captchaData.expiresAt.getTime() - now.getTime()),
        timeRemainingSeconds: Math.max(0, Math.floor((captchaData.expiresAt.getTime() - now.getTime()) / 1000)),
      } : null,
    };
  }

  /**
   * Cleanup expired CAPTCHAs (optional manual cleanup)
   * Note: CacheModule TTL handles this automatically, but this can be used for manual cleanup
   */
  async cleanupExpired(): Promise<number> {
    // CacheModule handles TTL automatically, but we can add manual cleanup if needed
    // This is mainly for logging/monitoring purposes
    return 0;
  }
}
