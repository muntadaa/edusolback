import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSpecializationDto {
  @ApiProperty({ description: 'Specialization title', example: 'Software Engineering' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Specialization description', example: 'A comprehensive program covering software development principles' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'PDF file path (set automatically on upload)', example: '/uploads/2/specializations/1234567890_specialization_document.pdf' })
  @IsOptional()
  @IsString()
  pdf_file?: string;

  @ApiPropertyOptional({ description: 'Total duration of this specialization in months (if not provided, it will be computed from levels)', example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  durationMonths?: number;

  @ApiPropertyOptional({ description: 'Accreditation date for this specialization', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  accreditationDate?: string;

  @ApiPropertyOptional({ description: 'Accreditation notes or reference text', example: 'Officially accredited by Ministry of Education' })
  @IsOptional()
  @IsString()
  accreditationText?: string;

  @ApiPropertyOptional({ description: 'Accreditation document path (PDF or image)', example: '/uploads/accreditations/spec-123.pdf' })
  @IsOptional()
  @IsString()
  accreditationDocument?: string;

  @ApiProperty({ description: 'Owning program identifier', example: 3 })
  @Type(() => Number)
  @IsNumber()
  program_id: number;

  @ApiPropertyOptional({ description: 'Company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;
}
