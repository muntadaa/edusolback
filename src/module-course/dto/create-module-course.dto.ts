import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleCourseDto {
  @ApiProperty({ description: 'Module identifier', example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  module_id: number;

  @ApiProperty({ description: 'Course identifier', example: 16 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  course_id: number;

  @ApiPropertyOptional({ description: 'Ordering index (tri)', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  tri?: number;

  @ApiPropertyOptional({ description: 'Volume hours', example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  volume?: number;

  @ApiPropertyOptional({ description: 'Coefficient value', example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coefficient?: number;

  @ApiPropertyOptional({ 
    description: 'Status: 0=disabled, 1=active, 2=pending, -1=archived, -2=deleted', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number;
}
