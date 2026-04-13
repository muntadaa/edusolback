import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStudentReportDto {
  @ApiProperty({ description: 'School year period identifier', example: 7 })
  @Type(() => Number)
  @IsNumber()
  school_year_period_id: number;

  @ApiProperty({ description: 'School year identifier', example: 3 })
  @Type(() => Number)
  @IsNumber()
  school_year_id: number;

  @ApiProperty({ description: 'Student identifier', example: 45 })
  @Type(() => Number)
  @IsNumber()
  student_id: number;

  @ApiPropertyOptional({ description: 'Remarks accompanying the report', example: 'Excellent progress this term.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Mention attributed to the student', example: 'Très Bien' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mention?: string;

  @ApiPropertyOptional({ description: 'Flag indicating whether the student passed', example: true, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  passed?: boolean;

  @ApiPropertyOptional({ description: 'Status code (matches school year statut)', example: 2, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;
}
