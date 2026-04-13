import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, Min, Max, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'Unique username used for login', example: 'jane.doe' })
  @IsString()
  username: string;

  @ApiPropertyOptional({ description: 'Secure password chosen by the user. If not provided, a random password will be generated and returned in the response.', example: '********' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'User email address', example: 'jane.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Role IDs assigned to the user', type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  role_ids?: number[];

  @ApiPropertyOptional({ description: 'Company identifier the user belongs to (automatically set from authenticated user)', example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Account status indicator', example: 1, minimum: -2, maximum: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'User phone number', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User profile picture URL', example: 'https://example.com/picture.jpg' })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiPropertyOptional({ description: 'Privacy Policy acceptance status', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  privacyPolicyAccepted?: boolean;

  @ApiPropertyOptional({ description: 'Terms of Use acceptance status', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiPropertyOptional({ description: 'Timestamp when consent was accepted', example: '2026-01-17T12:00:00Z' })
  @IsOptional()
  consentAcceptedAt?: Date;
}
