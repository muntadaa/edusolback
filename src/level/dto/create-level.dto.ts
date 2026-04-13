import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLevelDto {
  @ApiProperty({ description: 'Level title', example: 'Grade 10' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Optional level description', example: 'Upper secondary level focused on sciences.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'PDF file path (set automatically on upload)', example: '/uploads/2/levels/1234567890_level_document.pdf' })
  @IsOptional()
  @IsString()
  pdf_file?: string;

  @ApiPropertyOptional({ description: 'Numeric level ordering (>=1). Defaults to 1 if not provided.', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  level?: number;

  @ApiPropertyOptional({ description: 'Duration of this level in months', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  durationMonths?: number;

  @ApiPropertyOptional({ description: 'Accreditation date for this level', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  accreditationDate?: string;

  @ApiPropertyOptional({ description: 'Accreditation notes or reference text for this level', example: 'Level accredited by Ministry Decree 1234' })
  @IsOptional()
  @IsString()
  accreditationText?: string;

  @ApiPropertyOptional({ description: 'Accreditation document path for this level (PDF or image)', example: '/uploads/accreditations/level-123.pdf' })
  @IsOptional()
  @IsString()
  accreditationDocument?: string;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Status indicator', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number = 1;

  @ApiProperty({ description: 'Linked specialization identifier', example: 9 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  specialization_id: number;
}
