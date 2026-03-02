import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class SchoolYearQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number;

  @IsOptional()
  @IsEnum(['planned', 'ongoing', 'completed'])
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
}