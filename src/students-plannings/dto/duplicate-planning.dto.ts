import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsNotEmpty, Min, Max, ValidateIf, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum DuplicationType {
  WEEK = 'week',
  FREQUENCY = 'frequency',
  RECURRING = 'recurring',
}

export class DuplicatePlanningDto {
  @ApiProperty({ 
    description: 'Source planning ID to duplicate', 
    example: 12 
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  source_planning_id: number;

  @ApiProperty({ 
    description: 'Type of duplication', 
    enum: DuplicationType,
    example: DuplicationType.WEEK 
  })
  @IsEnum(DuplicationType)
  @IsNotEmpty()
  type: DuplicationType;

  @ApiProperty({ 
    description: 'Number of weeks to duplicate (for week type). Creates 6 plannings per week (Mon-Sat).', 
    example: 3,
    required: false 
  })
  @ValidateIf(o => o.type === 'week')
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'number_of_weeks must be a number' })
  @Min(1, { message: 'number_of_weeks must not be less than 1' })
  @Max(52, { message: 'number_of_weeks must not be greater than 52' })
  @IsNotEmpty({ message: 'number_of_weeks is required when type is "week"' })
  number_of_weeks?: number;

  @ApiProperty({ 
    description: 'Duration in months for recurring type. Creates plannings for same day/time for X months.', 
    example: 3,
    required: false 
  })
  @ValidateIf(o => o.type === 'recurring')
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'duration_months must be a number' })
  @Min(1, { message: 'duration_months must not be less than 1' })
  @Max(24, { message: 'duration_months must not be greater than 24' })
  @IsNotEmpty({ message: 'duration_months is required when type is "recurring"' })
  duration_months?: number;
}

