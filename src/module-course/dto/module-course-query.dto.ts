import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ModuleCourseQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by module identifier', example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  module_id?: number;

  @ApiPropertyOptional({ description: 'Filter by course identifier', example: 16 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  course_id?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by status: 0=disabled, 1=active, 2=pending, -1=archived, -2=deleted', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number;
}
