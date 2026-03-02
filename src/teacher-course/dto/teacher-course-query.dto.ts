import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TeacherCourseQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by teacher identifier', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacher_id?: number;

  @ApiPropertyOptional({ description: 'Filter by course identifier', example: 16 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  course_id?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by status: 0=disabled, 1=active, 2=pending, -1=archived, -2=deleted', 
    example: 1,
    minimum: -2,
    maximum: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number;
}
