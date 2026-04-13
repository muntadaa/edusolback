import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class StudentReportDetailQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status code', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;

  @ApiPropertyOptional({ description: 'Filter by student identifier', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  student_id?: number;

  @ApiPropertyOptional({ description: 'Filter by student report identifier', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  student_report_id?: number;

  @ApiPropertyOptional({ description: 'Filter by teacher identifier', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teacher_id?: number;

  @ApiPropertyOptional({ description: 'Filter by course identifier', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  course_id?: number;
}

