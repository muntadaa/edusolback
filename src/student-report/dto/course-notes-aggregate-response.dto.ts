import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseNotesAggregateStudentDto {
  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiPropertyOptional({ description: 'Picture URL key / path (same as Student.picture elsewhere)' })
  picture?: string | null;
}

export class CourseNotesAggregateCourseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Course title (intitule)' })
  title: string;

  @ApiPropertyOptional({ nullable: true, description: 'No separate code column in schema; null for now.' })
  code: string | null;
}

export class CourseNotesAggregateTeacherDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;
}

export class CourseNotesAggregateRowDto {
  @ApiProperty()
  student_id: number;

  @ApiProperty({ type: CourseNotesAggregateStudentDto })
  student: CourseNotesAggregateStudentDto;

  @ApiProperty()
  course_id: number;

  @ApiProperty({ type: CourseNotesAggregateCourseDto })
  course: CourseNotesAggregateCourseDto;

  @ApiProperty({
    description:
      'Teacher for this aggregate. Rows are per (student, course, teacher) so totals match “filter by prof” (Option A).',
  })
  teacher_id: number;

  @ApiProperty({ type: CourseNotesAggregateTeacherDto })
  teacher: CourseNotesAggregateTeacherDto;

  @ApiPropertyOptional({
    nullable: true,
    description: 'From planning.class_course → module when available',
  })
  module_id: number | null;

  @ApiPropertyOptional({ nullable: true })
  module_title: string | null;

  @ApiProperty({
    description:
      'Count of student_presence rows in this group (every scheduled session with a presence row in scope).',
  })
  session_count: number;

  @ApiProperty({
    description:
      'Sum of numeric grades. Rows with note = -1 (not marked) contribute 0 (same denominator rule as graded count for average).',
  })
  notes_sum: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Average of notes where note > -1 only; null if no graded session in the group.',
  })
  notes_avg: number | null;

  @ApiProperty({
    description: 'Number of sessions in the group where note > -1 (has a grade).',
  })
  graded_session_count: number;
}

export class CourseNotesAggregateFiltersEchoDto {
  @ApiProperty()
  class_id: number;

  @ApiProperty()
  school_year_id: number;

  @ApiProperty()
  school_year_period_id: number;

  @ApiProperty()
  period_label: string;

  @ApiPropertyOptional({ type: [Number] })
  student_ids?: number[];

  @ApiPropertyOptional({ type: [Number] })
  course_ids?: number[];

  @ApiPropertyOptional({ type: [Number] })
  teacher_ids?: number[];

  @ApiPropertyOptional()
  sort?: string | null;

  @ApiProperty({
    description:
      'One row per (student_id, course_id, teacher_id). Without teacher_ids filter, multiple teachers for the same course still produce separate rows.',
  })
  group_by: string;
}

export class CourseNotesAggregateResponseDto {
  @ApiProperty({ type: CourseNotesAggregateFiltersEchoDto })
  filters: CourseNotesAggregateFiltersEchoDto;

  @ApiProperty({ type: [CourseNotesAggregateRowDto] })
  rows: CourseNotesAggregateRowDto[];

  @ApiProperty({
    description:
      'session_count counts all presence rows in the group. notes_sum uses SUM(note) treating note <= -1 as 0. notes_avg = notes_sum / graded_session_count when graded_session_count > 0.',
  })
  aggregation_rules: string;
}
