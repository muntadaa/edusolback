import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Display name of the company', example: 'Acme Schools' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Company logo URL or path', example: '/uploads/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Primary contact email address', example: 'contact@acmeschools.com' })
  @IsOptional()
  @IsString()
  email?: string;

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

  @ApiPropertyOptional({ description: 'Workflow status indicator', example: 1, minimum: -2, maximum: 2 })
  @IsOptional()
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Hex value for the primary brand color', example: '#1D4ED8' })
  @IsOptional()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/, { message: 'primaryColor must be a valid hex color (e.g. #1D4ED8)' })
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Hex value for the secondary brand color', example: '#F97316' })
  @IsOptional()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/, { message: 'secondaryColor must be a valid hex color (e.g. #F97316)' })
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

  @ApiPropertyOptional({ description: 'Show logo on the left side of PDF', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  logo_left?: boolean;

  @ApiPropertyOptional({ description: 'Show logo on the right side of PDF', example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  logo_right?: boolean;

  @ApiPropertyOptional({ description: 'Use letterhead paper (papier entête)', example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  papier_entete?: boolean;
}
