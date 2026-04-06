import { createHash } from 'crypto';

/** SHA-256 hex of the plain token — indexed in DB for fast invite validation (avoids O(n) bcrypt scans). */
export function passwordSetTokenLookup(plainToken: string): string {
  return createHash('sha256').update(plainToken, 'utf8').digest('hex');
}
