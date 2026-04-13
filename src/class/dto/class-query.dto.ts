import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ClassQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // matches description or title

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  program_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  specialization_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  level_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;
}


