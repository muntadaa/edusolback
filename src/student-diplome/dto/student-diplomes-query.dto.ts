import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StudentDiplomesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by title, school, diplome, city, or country', example: 'bachelor' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by student ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  student_id?: number;

  @ApiPropertyOptional({ description: 'Filter by year', example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annee?: number;

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
  status?: number;
}


