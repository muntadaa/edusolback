import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SpecializationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // title or description

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  program_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;
}


