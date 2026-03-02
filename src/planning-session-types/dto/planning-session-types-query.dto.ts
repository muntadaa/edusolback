import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class PlanningSessionTypesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'], { message: 'status must be active or inactive' })
  status?: string;
}

