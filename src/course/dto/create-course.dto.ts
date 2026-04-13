import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course title displayed to students', example: 'Introduction to Physics' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Optional course description', example: 'Covers basic mechanics and thermodynamics.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Total number of instructional hours', example: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  volume?: number;

  @ApiPropertyOptional({ description: 'Coefficient or weight of the course', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coefficient?: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'PDF file path (set automatically on upload)', example: '/uploads/2/courses/1234567890_course_document.pdf' })
  @IsOptional()
  @IsString()
  pdf_file?: string;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Modules linked to the course', example: [3, 8, 12] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  module_ids?: number[];
}
