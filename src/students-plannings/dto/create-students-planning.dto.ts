import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MinLength, MaxLength, IsIn, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Transforms time string to HH:MM format
 * Handles: "06:00:00" -> "06:00", "6:00" -> "06:00", "6:0" -> "06:00"
 */
function normalizeTime(value: any): string {
  if (!value) return value;
  
  // Convert to string if it's a number or other type
  const timeStr = String(value).trim();
  
  // Remove seconds if present (e.g., "06:00:00" -> "06:00")
  const parts = timeStr.split(':');
  if (parts.length < 2) return value; // Invalid format, let validator handle it
  
  // Take only hours and minutes
  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1].padStart(2, '0');
  
  // Validate hours and minutes are valid numbers
  const hoursNum = parseInt(hours, 10);
  const minutesNum = parseInt(minutes, 10);
  
  if (isNaN(hoursNum) || isNaN(minutesNum)) return value;
  if (hoursNum < 0 || hoursNum > 23) return value;
  if (minutesNum < 0 || minutesNum > 59) return value;
  
  return `${hours}:${minutes}`;
}

export class CreateStudentsPlanningDto {
  @ApiProperty({ description: 'Planning period label', example: 'Semester 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  period: string;

  @ApiProperty({ description: 'Teacher identifier', example: 7 })
  @Type(() => Number)
  @IsNumber()
  teacher_id: number;

  @ApiProperty({ description: 'Course identifier', example: 12 })
  @Type(() => Number)
  @IsNumber()
  course_id: number;

  @ApiProperty({ description: 'Class identifier', example: 3 })
  @Type(() => Number)
  @IsNumber()
  class_id: number;

  @ApiPropertyOptional({ description: 'Class room identifier', example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_room_id?: number;

  @ApiPropertyOptional({ description: 'Planning session type identifier', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  planning_session_type_id?: number;

  @ApiProperty({ description: 'Session date', example: '2025-11-10' })
  @IsDateString()
  date_day: string;

  @ApiProperty({ description: 'Start time (24h format, accepts HH:MM or HH:MM:SS)', example: '09:00' })
  @Transform(({ value }) => normalizeTime(value))
  @IsString()
  @Matches(TIME_REGEX, { message: 'hour_start must be in 24-hour format (HH:MM), e.g., "09:00" or "14:30"' })
  hour_start: string;

  @ApiProperty({ description: 'End time (24h format, accepts HH:MM or HH:MM:SS)', example: '11:00' })
  @Transform(({ value }) => normalizeTime(value))
  @IsString()
  @Matches(TIME_REGEX, { message: 'hour_end must be in 24-hour format (HH:MM), e.g., "09:00" or "14:30"' })
  hour_end: string;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'School year identifier', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number;

  @ApiPropertyOptional({ description: 'Class course identifier (reference to the class-course used to generate this planning)', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_course_id?: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Whether the session has notes', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasNotes?: boolean;

  /** Alias for hasNotes (snake_case) so frontend can send either. */
  @ApiPropertyOptional({ description: 'Whether the session has notes (alias for hasNotes)', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  has_notes?: boolean;

  /** Presence validation: 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED. Default 0. */
  @ApiPropertyOptional({ description: 'Presence validation status: 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED', enum: [0, 1, 2], default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsIn([0, 1, 2])
  presence_validation_status?: number;

  /** Notes validation: 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED. Only when hasNotes. Default 0. */
  @ApiPropertyOptional({ description: 'Notes validation status: 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED', enum: [0, 1, 2], default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsIn([0, 1, 2])
  notes_validation_status?: number;

  @ApiPropertyOptional({ description: 'True when teacher has validated presence (activated)', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  presence_validated_teacher?: boolean;

  @ApiPropertyOptional({ description: 'True when controller has validated presence (final)', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  presence_validated_controleur?: boolean;

  @ApiPropertyOptional({ description: 'True when teacher has validated notes. Only when has_notes.', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  notes_validated_teacher?: boolean;

  @ApiPropertyOptional({ description: 'True when controller has validated notes (final). Only when has_notes.', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  notes_validated_controleur?: boolean;
}
