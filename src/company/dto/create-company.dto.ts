import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsInt, Min, Max, IsNotEmpty, Matches } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Display name of the company', example: 'Acme Schools' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Company logo. Can be uploaded as a file (JPEG, PNG, GIF, WebP, max 2MB) or provided as a URL string. When uploading a file, use multipart/form-data with field name "logo".', 
    type: 'string',
    format: 'binary',
    example: 'https://cdn.example.com/logos/acme.png' 
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ description: 'Primary contact email address', example: 'contact@acmeschools.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Support phone number', example: '+1-444-555-1212' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'City where the company is located', example: 'Paris' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Country where the company is located', example: 'France' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Physical address of the company', example: '123 Main Street, Suite 100' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Postal code of the company', example: '75001' })
  @IsOptional()
  @IsString()
  codePostal?: string;

  @ApiPropertyOptional({
    description: 'Default currency code (ISO‑4217, 3 uppercase letters, e.g. MAD, EUR, USD)',
    example: 'MAD',
  })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a valid ISO‑4217 code (3 uppercase letters, e.g. MAD, EUR, USD)',
  })
  currency?: string;

  @ApiPropertyOptional({ description: 'Workflow status indicator', example: 1, minimum: -2, maximum: 2 })
  @IsOptional()
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number; // mapped to column 'statut' if present in entity

  @ApiPropertyOptional({ description: 'Hex value for the primary brand color', example: '#F2791E' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor must be a valid hex color format (#RRGGBB)' })
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Hex value for the secondary brand color', example: '#1D3867' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'secondaryColor must be a valid hex color format (#RRGGBB)' })
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Hex value for the tertiary brand color (backgrounds, cards, highlights)', example: '#f8fafc' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'tertiaryColor must be a valid hex color format (#RRGGBB)' })
  tertiaryColor?: string;

  @ApiPropertyOptional({ description: 'Header text line 1 (entête 1)', example: 'Company Header Line 1' })
  @IsOptional()
  @IsString()
  entete_1?: string;

  @ApiPropertyOptional({ description: 'Header text line 2 (entête 2)', example: 'Company Header Line 2' })
  @IsOptional()
  @IsString()
  entete_2?: string;

  @ApiPropertyOptional({ description: 'Header text line 3 (entête 3)', example: 'Company Header Line 3' })
  @IsOptional()
  @IsString()
  entete_3?: string;

  @ApiPropertyOptional({ description: 'Footer text line 1 (pied 1)', example: 'Company Footer Line 1' })
  @IsOptional()
  @IsString()
  pied_1?: string;

  @ApiPropertyOptional({ description: 'Footer text line 2 (pied 2)', example: 'Company Footer Line 2' })
  @IsOptional()
  @IsString()
  pied_2?: string;

  @ApiPropertyOptional({ description: 'Footer text line 3 (pied 3)', example: 'Company Footer Line 3' })
  @IsOptional()
  @IsString()
  pied_3?: string;

  @ApiProperty({ description: 'CAPTCHA token received from /api/captcha/generate endpoint (must be pre-verified via /api/captcha/pre-verify)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString({ message: 'CAPTCHA token must be a string' })
  @IsNotEmpty({ message: 'CAPTCHA token is required' })
  captchaToken: string;

  @ApiPropertyOptional({ description: 'CAPTCHA answer (optional if token was pre-verified, required for backward compatibility)', example: 'A3B7K' })
  @IsOptional()
  @IsString({ message: 'CAPTCHA answer must be a string' })
  captchaAnswer?: string;
}
