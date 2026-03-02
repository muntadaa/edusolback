import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ProgramQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // title search

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;
}
