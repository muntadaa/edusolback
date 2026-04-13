import { IsEmail, IsString, MinLength, Matches, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
  
}

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsOptional()
  password?: string;
  
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsNumber()
  @Type(() => Number)
  company_id: number;

  @IsOptional()
  @IsString({ message: 'CAPTCHA token must be a string' })
  captchaToken?: string;

  @IsOptional()
  captchaAnswer?: string | number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsBoolean({ message: 'privacyPolicyAccepted must be a boolean' })
  privacyPolicyAccepted: boolean;

  @IsBoolean({ message: 'termsAccepted must be a boolean' })
  termsAccepted: boolean;
  
  // Note: role_ids removed - registration doesn't assign roles
  // First user for a company automatically gets admin role via setup-admin endpoint
  // Regular users are created via /users endpoint (admin only) with role_ids
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @IsString({ message: 'CAPTCHA token must be a string' })
  captchaToken?: string;

  @IsOptional()
  captchaAnswer?: string | number;
}

export class ResetPasswordDto {
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString({ message: 'Confirm password must be a string' })
  @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
  confirmPassword: string;
}

export class ResetPasswordWithTokenDto {
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'Current password must be a string' })
  @MinLength(6, { message: 'Current password must be at least 6 characters long' })
  currentPassword: string;

  @IsString({ message: 'New password must be a string' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;

  @IsString({ message: 'Confirm password must be a string' })
  @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
  confirmPassword: string;
}

export class SetPasswordDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString({ message: 'Confirm password must be a string' })
  @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
  confirmPassword: string;
}

export class ValidateTokenDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}