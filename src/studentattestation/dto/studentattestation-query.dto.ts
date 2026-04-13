import { IsOptional, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StudentAttestationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by student name or attestation title', example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status: 0=disabled, 1=active, 2=pending, -1=archiver, -2=deleted', 
    example: 1,
    enum: [-2, -1, 0, 1, 2]
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  Status?: number;

  @ApiPropertyOptional({ description: 'Filter by student ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  Idstudent?: number;

  @ApiPropertyOptional({ description: 'Filter by attestation ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  Idattestation?: number;
}
