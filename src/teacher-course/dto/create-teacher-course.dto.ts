import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeacherCourseDto {
  @ApiProperty({ description: 'Teacher identifier', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacher_id: number;

  @ApiProperty({ description: 'Course identifier', example: 16 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  course_id: number;

  @ApiPropertyOptional({ 
    description: 'Status: 0=disabled, 1=active, 2=pending, -1=archived, -2=deleted', 
    example: 1,
    minimum: -2,
    maximum: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number;
}
