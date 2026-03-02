import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ClassStudentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search phrase applied to class title or student name', example: 'Smith' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by assignment status (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Filter by class identifier', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_id?: number;

  @ApiPropertyOptional({ description: 'Filter by student identifier', example: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  student_id?: number;

  @ApiPropertyOptional({ description: 'Filter by company identifier', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Filter by school year identifier', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number;
}

