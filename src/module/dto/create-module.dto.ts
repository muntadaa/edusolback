import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleDto {
  @ApiProperty({ description: 'Module title', example: 'Mathematics Module 1' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Optional module description', example: 'Foundational module covering algebra and calculus.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Total number of hours', example: 32 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  volume?: number;

  @ApiPropertyOptional({ description: 'Module coefficient/weight', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coefficient?: number;

  @ApiPropertyOptional({ description: 'Status flag (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'PDF file path (set automatically on upload)', example: '/uploads/2/modules/1234567890_module_document.pdf' })
  @IsOptional()
  @IsString()
  pdf_file?: string;

  @ApiPropertyOptional({ description: 'Company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Course identifiers linked to the module', example: [1, 2, 5] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  course_ids?: number[];
}
