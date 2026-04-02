import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PreInscriptionStatus } from '../enums/preinscription-status.enum';

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commercial_id?: number;

  @ApiPropertyOptional({
    enum: PreInscriptionStatus,
    description: 'Filter by workflow status (e.g. SENT_TO_ADMIN for admin inbox)',
  })
  @IsOptional()
  @IsEnum(PreInscriptionStatus)
  status?: PreInscriptionStatus;
}

