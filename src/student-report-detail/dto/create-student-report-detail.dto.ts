import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStudentReportDetailDto {
  @ApiProperty({ description: 'Parent student report identifier', example: 12 })
  @Type(() => Number)
  @IsNumber()
  student_report_id: number;

  @ApiProperty({ description: 'Teacher identifier', example: 7 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  teacher_id: number;

  @ApiProperty({ description: 'Course identifier', example: 4 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  course_id: number;

  @ApiPropertyOptional({ description: 'Remarks associated with this detail', example: 'Strong performance in labs.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Grade / note (decimals allowed, e.g. 11.67)',
    example: 11.67,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  note?: number;

  @ApiPropertyOptional({ description: 'Status code (matches school year statut)', example: 2, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;
}
