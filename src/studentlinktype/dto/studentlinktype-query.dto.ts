import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentLinkTypeQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // title

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  student_id?: number;
}
