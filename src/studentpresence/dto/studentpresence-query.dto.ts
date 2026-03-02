import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class StudentPresenceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status code', example: 2 })
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

  @ApiPropertyOptional({ description: 'Filter by student planning identifier', example: 12 })
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

