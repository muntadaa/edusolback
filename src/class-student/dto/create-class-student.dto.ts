import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassStudentDto {
  @ApiProperty({ description: 'Related class identifier', example: 12 })
  @Type(() => Number)
  @IsNumber()
  class_id: number;

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
