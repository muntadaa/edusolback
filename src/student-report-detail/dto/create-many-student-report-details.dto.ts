import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/** One line item without student_report_id (set on the parent batch DTO). */
export class CreateStudentReportDetailItemDto {
  @ApiPropertyOptional({ description: 'Teacher identifier', nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teacher_id?: number | null;

  @ApiPropertyOptional({ description: 'Course identifier', nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  course_id?: number | null;

  @ApiPropertyOptional({ description: 'Remarks for this line' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Grade / note (decimals allowed, e.g. 11.67)', example: 11.67 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  note?: number;

  @ApiPropertyOptional({ description: 'Status code', example: 2, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;
}

export class CreateManyStudentReportDetailsDto {
  @ApiProperty({ description: 'Parent student report for all lines', example: 12 })
  @Type(() => Number)
  @IsNumber()
  student_report_id: number;

  @ApiProperty({ type: [CreateStudentReportDetailItemDto], minItems: 1, maxItems: 500 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateStudentReportDetailItemDto)
  details: CreateStudentReportDetailItemDto[];
}
