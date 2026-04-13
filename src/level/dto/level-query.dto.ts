import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class LevelQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // search by title

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  specialization_id?: number;

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
