import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class StudentReportQueryDto extends PaginationDto {
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

  @ApiPropertyOptional({ description: 'Filter by school year period identifier', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_period_id?: number;

  @ApiPropertyOptional({ description: 'Filter by school year identifier', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number;

  @ApiPropertyOptional({ description: 'Filter by pass flag', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  passed?: boolean;
}

