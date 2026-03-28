import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

/** Accept "1,2,3", repeated query keys, or JSON array → number[]. Empty / missing = no filter. */
export function transformIdArray(value: unknown): number[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) {
    const nums = value.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
    return nums.length ? nums : undefined;
  }
  if (typeof value === 'string') {
    const nums = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0);
    return nums.length ? nums : undefined;
  }
  return undefined;
}

export class CourseNotesAggregateQueryDto {
  @ApiProperty({ description: 'Class identifier (roster scope)', example: 3 })
  @Type(() => Number)
  @IsInt()
  class_id: number;

  @ApiProperty({ description: 'School year identifier', example: 2 })
  @Type(() => Number)
  @IsInt()
  school_year_id: number;

  @ApiProperty({ description: 'School year period identifier', example: 5 })
  @Type(() => Number)
  @IsInt()
  school_year_period_id: number;

  @ApiPropertyOptional({
    description:
      'Optional planning period label override (same as dashboard). Defaults to the school year period title.',
  })
  @IsOptional()
  @IsString()
  period_label?: string;

  @ApiPropertyOptional({
    description: 'Restrict to these student IDs (comma-separated or repeated). Omit = all students in class.',
    example: '12,34',
  })
  @IsOptional()
  @Transform(({ value }) => transformIdArray(value))
  student_ids?: number[];

  @ApiPropertyOptional({
    description: 'Restrict to these course IDs (comma-separated or repeated). Omit = all courses.',
  })
  @IsOptional()
  @Transform(({ value }) => transformIdArray(value))
  course_ids?: number[];

  @ApiPropertyOptional({
    description: 'Restrict to plannings with these teacher IDs (comma-separated or repeated). Omit = all teachers.',
  })
  @IsOptional()
  @Transform(({ value }) => transformIdArray(value))
  teacher_ids?: number[];

  @ApiPropertyOptional({
    description:
      'Comma-separated sort keys. Suffix :desc optional. Allowed: student_name, course_title, teacher_name, session_count, notes_sum, notes_avg. Default: student_name,course_title,teacher_name.',
    example: 'student_name,course_title',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}

/** POST body uses the same shape (arrays allowed as JSON arrays). */
export class CourseNotesAggregateBodyDto extends CourseNotesAggregateQueryDto {}
