import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Body for POST /preinscriptions/commercial (Excel import, one row per request).
 * Same field rules as public create for overlapping columns; server sets company_id only. Status NEW, commercial unassigned.
 */
export class CreateCommercialPreinscriptionDto {
  @ApiProperty({ example: 'John', maxLength: 255 })
  @Transform(({ value }) => trim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  first_name: string;

  @ApiProperty({ example: 'Doe', maxLength: 255 })
  @Transform(({ value }) => trim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  last_name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+212612345678', description: 'WhatsApp phone number' })
  @Transform(({ value }) => trim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  whatsapp_phone: string;

  @ApiProperty({ example: 'Moroccan', maxLength: 255 })
  @Transform(({ value }) => trim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nationality: string;

  @ApiProperty({ example: 'Casablanca', maxLength: 255 })
  @Transform(({ value }) => trim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string;

  @ApiPropertyOptional({
    example: 'Licence en Informatique',
    maxLength: 255,
    description: 'Optional for Excel import; stored as empty string if omitted.',
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  current_formation?: string;

  @ApiPropertyOptional({
    description: 'Desired formation (free text). Optional for Excel import; stored as empty string if omitted.',
    maxLength: 255,
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  desired_formation?: string;

  @ApiPropertyOptional({ example: '2001-05-17', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiPropertyOptional({ example: 'Bd Zerktouni', maxLength: 255 })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  how_known?: string;
}
