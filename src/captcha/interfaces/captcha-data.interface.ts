export interface CaptchaData {
  answer: string | number;
  expiresAt: Date;
  used: boolean;
  preVerified: boolean; // True if CAPTCHA answer was verified but token not yet consumed
  attempts: number;
  createdAt: Date;
}
