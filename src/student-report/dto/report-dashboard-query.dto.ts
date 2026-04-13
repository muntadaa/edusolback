import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class ReportDashboardQueryDto {
  @ApiProperty({ description: 'Target class identifier', example: 3 })
  @Type(() => Number)
  @IsInt()
  class_id: number;

  @ApiProperty({ description: 'School year identifier', example: 2 })
  @Type(() => Number)
  @IsInt()
  school_year_id: number;

  @ApiProperty({ description: 'School year period identifier', example: 5 })
  @Type(() => Number)
  @IsInt()
  school_year_period_id: number;

  @ApiPropertyOptional({ description: 'Optional explicit planning period label override (defaults to the school year period title)', example: 'Semester 1' })
  @IsOptional()
  @IsString()
  period_label?: string;

  @ApiPropertyOptional({ description: 'Filter data to a specific student', example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  student_id?: number;

  @ApiPropertyOptional({ description: 'Filter planning/presence data to a specific course', example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  course_id?: number;

  @ApiPropertyOptional({ description: 'Filter planning/presence data to a specific teacher', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teacher_id?: number;

  @ApiPropertyOptional({ description: 'Optional page number when requesting paginated students', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: 'Optional page size (max 100) when requesting paginated students', example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}


