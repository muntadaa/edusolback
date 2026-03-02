import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min, IsInt, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentsPlanningQueryDto extends PaginationDto {
  // Override limit to allow unlimited results for calendar view
  @ApiPropertyOptional({ description: 'Number of items per page (no maximum limit for calendar view)', example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare limit?: number;
  @ApiPropertyOptional({ description: 'Filter by status code', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Filter by class identifier', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_id?: number;

  @ApiPropertyOptional({ description: 'Filter by classroom identifier', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_room_id?: number;

  @ApiPropertyOptional({ description: 'Filter by teacher identifier', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teacher_id?: number;

  @ApiPropertyOptional({ description: 'Filter by course identifier', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  course_id?: number;

  @ApiPropertyOptional({ description: 'Filter by planning session type identifier', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  planning_session_type_id?: number;

  @ApiPropertyOptional({ description: 'Filter by school year identifier', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number;

  @ApiPropertyOptional({ description: 'Filter by class course identifier (e.g. for class course modal)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_course_id?: number;

  @ApiPropertyOptional({ description: 'Start of date range (inclusive). Format: YYYY-MM-DD. Used with date_day_to for week/month view.', example: '2026-01-26' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_day_from must be YYYY-MM-DD' })
  date_day_from?: string;

  @ApiPropertyOptional({ description: 'End of date range (inclusive). Format: YYYY-MM-DD. Used with date_day_from for week/month view.', example: '2026-02-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_day_to must be YYYY-MM-DD' })
  date_day_to?: string;

  @ApiPropertyOptional({ description: 'Sort order for date and time', enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}

