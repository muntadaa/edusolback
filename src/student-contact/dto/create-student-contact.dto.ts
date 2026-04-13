import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentContactDto {
  @ApiProperty({ description: 'Contact first name', example: 'Maria' })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ description: 'Contact last name', example: 'Garcia' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiPropertyOptional({ description: 'Birth date of the contact (ISO)', example: '1978-01-19' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ description: 'Contact email address', example: 'maria.garcia@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '+1-555-0400' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Mailing address', example: '456 Oak Avenue' })
  @IsOptional()
  @IsString()
  adress?: string;

  @ApiPropertyOptional({ description: 'City of residence', example: 'Madrid' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Country of residence', example: 'Spain' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code of the contact', example: '28001' })
  @IsOptional()
  @IsString()
  codePostal?: string;

  @ApiProperty({ description: 'Student identifier', example: 1 })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  student_id: number;

  @ApiPropertyOptional({ description: 'Relationship type identifier', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  studentlinktypeId?: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Company identifier (automatically set from authenticated user)', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;
}

