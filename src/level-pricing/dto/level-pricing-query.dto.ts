import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class LevelPricingQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status code', enum: [-2, -1, 0, 1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;

  @ApiPropertyOptional({ description: 'Filter by level identifier', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  level_id?: number;

  @ApiPropertyOptional({ description: 'Search keyword applied to title', example: 'monthly' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}

