import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class PreinscriptionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // first_name, last_name, email, city, desired_formation
}

