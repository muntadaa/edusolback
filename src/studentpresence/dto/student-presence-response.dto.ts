import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response shape for student presence (GET/PATCH/POST). Relations may be included when loaded.
 * Frontend: use `presence_locked` and `notes_locked` to disable inputs independently; do not rely on `locked` alone.
 */
export class StudentPresenceResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  student_planning_id: number;

  @ApiProperty()
  student_id: number;

  @ApiProperty({ enum: ['present', 'absent', 'late', 'excused'] })
  presence: string;

  @ApiProperty({ description: 'Grade or score associated with the session (-1 if none)' })
  note: number;

  @ApiPropertyOptional()
  remarks?: string;

  @ApiProperty()
  company_id: number;

  @ApiPropertyOptional()
  report_id?: number;

  @ApiProperty()
  validate_report: boolean;

  @ApiProperty({
    description:
      'If true, the API rejects changes to presence (present/absent/late/excused). Causes: session activated, scholarity finalized presence (`presence_validated_controleur` on planning), or this row flag set by the backend.',
  })
  presence_locked: boolean;

  @ApiProperty({
    description:
      'If true, the API rejects changes to note, remarks, report_id, validate_report. Causes: scholarity finalized notes (`notes_validated_controleur` on planning), or `POST .../notes/validate`, or this row flag.',
  })
  notes_locked: boolean;

  @ApiProperty({
    description:
      'Legacy: `true` only when both `presence_locked` and `notes_locked` are true (backend keeps it in sync). Prefer the two flags for UI state.',
  })
  locked: boolean;

  @ApiProperty()
  status: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Included when relations are loaded' })
  student?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Included when relations are loaded' })
  studentPlanning?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Included when relations are loaded' })
  studentReport?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Included when relations are loaded' })
  company?: Record<string, unknown>;
}
