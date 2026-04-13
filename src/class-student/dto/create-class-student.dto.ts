import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassStudentDto {
  @ApiPropertyOptional({ description: 'Related class identifier (nullable when assigning without a class)', example: 12 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  class_id?: number | null;

  @ApiPropertyOptional({ description: 'Program identifier (required when class_id is null)', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  program_id?: number | null;

  @ApiPropertyOptional({ description: 'Specialization identifier (required when class_id is null)', example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  specialization_id?: number | null;

  @ApiPropertyOptional({ description: 'Level identifier (required when class_id is null)', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  level_id?: number | null;

  @ApiPropertyOptional({ description: 'School year identifier (required when class_id is null)', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number | null;

  @ApiProperty({ description: 'Student identifier', example: 54 })
  @Type(() => Number)
  @IsNumber()
  student_id: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Ordering index used to sort students within a class', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tri?: number;
}
