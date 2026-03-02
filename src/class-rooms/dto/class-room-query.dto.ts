import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ClassRoomQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // matches code or title

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  classroom_type_id?: number; // filter by classroom type

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


