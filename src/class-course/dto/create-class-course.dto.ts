import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateClassCourseDto {
  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status flag (0 disabled, 1 active, 2 pending, -1 archived, -2 deleted)',
    minimum: -2,
    maximum: 2,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiProperty({ description: 'Linked level identifier' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level_id: number;

  @ApiProperty({ description: 'Linked module identifier' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  module_id: number;

  @ApiProperty({ description: 'Linked course identifier' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  course_id: number;

  @ApiPropertyOptional({ description: 'Total volume (hours) for the course', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  volume?: number;

  @ApiPropertyOptional({ description: 'Number of repetitions per week', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  weeklyFrequency?: number;

  @ApiPropertyOptional({ description: 'Indicates if the course is scheduled every day', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allday?: boolean;

  @ApiPropertyOptional({ description: 'Duration (hours) per session', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;
}
