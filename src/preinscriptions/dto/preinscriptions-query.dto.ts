import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class PreinscriptionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // first_name, last_name, email, city, desired_formation

  @IsOptional()
  @IsString()
  country?: string; // maps to nationality field in preinscriptions

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  desired_formation?: string;
}

