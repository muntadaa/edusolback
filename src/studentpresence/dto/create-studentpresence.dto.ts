import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsIn, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateStudentPresenceDto {
  @ApiProperty({ description: 'Related student planning identifier', example: 12 })
  @Type(() => Number)
  @IsNumber()
  student_planning_id: number;

  @ApiProperty({ description: 'Student identifier', example: 45 })
  @Type(() => Number)
  @IsNumber()
  student_id: number;

  @ApiPropertyOptional({ description: 'Presence status', enum: ['present', 'absent', 'late', 'excused'], default: 'absent' })
  @IsOptional()
  @IsString()
  @IsIn(['present', 'absent', 'late', 'excused'])
  presence?: string;

  @ApiPropertyOptional({ description: 'Grade or note associated with the presence', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  note?: number;

  @ApiPropertyOptional({ description: 'Remarks about the student attendance', example: 'Arrived 10 minutes late' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Related student report identifier', example: 78 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  report_id?: number;

  @ApiPropertyOptional({ description: 'Whether the related report is validated', example: true, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  validate_report?: boolean;

  @ApiPropertyOptional({ description: 'Status code ', example: 2, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;
}
