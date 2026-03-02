import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class StudentPaymentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status code', enum: [-2, -1, 0, 1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;

  @ApiPropertyOptional({ description: 'Filter by student identifier', example: 105 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  student_id?: number;

  @ApiPropertyOptional({ description: 'Filter by school year identifier', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number;

  @ApiPropertyOptional({ description: 'Filter by level identifier', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  level_id?: number;

  @ApiPropertyOptional({ description: 'Filter by level pricing identifier', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  level_pricing_id?: number;

  @ApiPropertyOptional({ description: 'Filter payments made on a specific date', example: '2025-01-10' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Filter by payment mode', example: 'Cash' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mode?: string;

  @ApiPropertyOptional({ description: 'Search query applied to reference or payment mode', example: 'TXN' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

