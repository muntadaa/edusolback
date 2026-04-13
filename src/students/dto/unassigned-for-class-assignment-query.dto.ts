import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class UnassignedForClassAssignmentQueryDto extends PaginationDto {
  @ApiProperty({ description: 'Target class to assign students into', example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  class_id: number;

  @ApiPropertyOptional({ description: 'Search first name, last name, or email (same as GET /students)', example: 'Ali' })
  @IsOptional()
  @IsString()
  search?: string;
}
