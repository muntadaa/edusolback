import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Standalone pagination (not extending shared PaginationDto) so `limit` can exceed 100
 * when loading all presence rows for one planning session (class sizes > 100).
 */
export class StudentPresenceQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description:
      'Page size. When filtering by student_planning_id, default is high so all students load (avoid “absent after refresh” when only first N rows were returned).',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by presence row status code', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;

  @ApiPropertyOptional({ description: 'Filter by student identifier', example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  student_id?: number;

  @ApiPropertyOptional({ description: 'Filter by student planning (session) identifier', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  student_planning_id?: number;

  @ApiPropertyOptional({ description: 'Filter by student report identifier', example: 78 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  report_id?: number;
}
