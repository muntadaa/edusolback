import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ClassCourseQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Status filter (-2 to 2)', minimum: -2, maximum: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Filter by level ID', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level_id?: number;

  @ApiPropertyOptional({ description: 'Filter by module ID', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  module_id?: number;

  @ApiPropertyOptional({ description: 'Filter by course ID', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  course_id?: number;

  @ApiPropertyOptional({ description: 'Filter by allDay flag', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allday?: boolean;
}

