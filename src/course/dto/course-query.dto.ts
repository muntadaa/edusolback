import { IsOptional, IsString, IsInt, Min, IsNumber, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CourseQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

 @IsOptional()
   @IsNumber()
   @Min(-2)
   @Max(2)
   status?: number;
}
