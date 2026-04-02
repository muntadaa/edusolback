import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, Min, Max, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateStudentDto {
  @ApiPropertyOptional({ description: 'Student gender', example: 'female' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Student first name', example: 'Emma' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ description: 'Student last name', example: 'Lopez' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({ description: 'Date of birth (ISO)', example: '2010-09-03' })
  @IsOptional()
  @IsDateString()
  birthday?: string; // ISO date (YYYY-MM-DD)

  @ApiProperty({ description: 'Guardian contact email', example: 'emma.lopez@example.com' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  @IsString({ message: 'email must be a string' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @ApiPropertyOptional({ description: 'Backup/secondary email address', example: 'backup.email@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'email2 must be a valid email address' })
  email2?: string;

  @ApiPropertyOptional({ description: 'Primary phone number', example: '+1-555-0300' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Backup/secondary phone number', example: '+1-555-0301' })
  @IsOptional()
  @IsString()
  phone2?: string;

  @ApiPropertyOptional({ description: 'Home address', example: '221B Baker Street' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City of residence', example: 'London' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Country of residence', example: 'United Kingdom' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code of the student', example: '75001' })
  @IsOptional()
  @IsString({ message: 'Postal code must be a string' })
  codePostal?: string;

  @ApiPropertyOptional({ description: 'Nationality of the student', example: 'British' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Stored profile picture path', example: '/uploads/students/1700000000000_avatar.png' })
  @IsOptional()
  picture?: string;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({
    description:
      'School matricule (YYYY + 5 digits). Usually assigned automatically when converting from pre-inscription; optional on manual create.',
    example: '202600001',
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  matricule_ecole?: string;

  @ApiPropertyOptional({
    description: 'State / official matricule (entered manually by admin)',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  matricule_etat?: string;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;
}
