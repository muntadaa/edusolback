import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgramDto {
  @ApiProperty({ description: 'Program title shown to users', example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Rich description of the program', example: 'Undergraduate program covering algorithms, systems and AI.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'PDF file path (set automatically on upload)', example: '/uploads/2/programs/1234567890_program_document.pdf' })
  @IsOptional()
  @IsString()
  pdf_file?: string;

  @ApiPropertyOptional({ description: 'Total duration of this program in months (if not provided, it will be computed from specializations)', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationMonths?: number;

  @ApiPropertyOptional({ description: 'Accreditation date for this program', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  accreditationDate?: string;

  @ApiPropertyOptional({ description: 'Accreditation notes or reference text', example: 'Officially accredited by Ministry of Education' })
  @IsOptional()
  @IsString()
  accreditationText?: string;

  @ApiPropertyOptional({ description: 'Accreditation document path (PDF or image)', example: '/uploads/accreditations/program-123.pdf' })
  @IsOptional()
  @IsString()
  accreditationDocument?: string;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Status flag (1 = active)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number = 1;
}
