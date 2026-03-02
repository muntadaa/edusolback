import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
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
