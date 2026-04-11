import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Flat student + academic snapshot for labels / print (from students, class_students, classes, specializations, levels, school_years). */
export class StudentSummaryResponseDto {
  @ApiProperty({ example: 'waas' })
  firstName: string;

  @ApiProperty({ example: 'Agousrd' })
  lastName: string;

  @ApiProperty({ example: 'waas Agousrd' })
  fullName: string;

  @ApiPropertyOptional({
    example: '2026/03/30',
    nullable: true,
    description: 'Birth date as YYYY/MM/DD when known.',
  })
  datebirth: string | null;

  @ApiPropertyOptional({
    example: '3A',
    description:
      'Class title when assigned; if class_id is set but title is empty/null, value is `class` + id (e.g. class12). Null when no class_id.',
  })
  classe: string | null;

  @ApiPropertyOptional({ example: 'P3 S3' })
  specialization: string | null;

  @ApiPropertyOptional({ example: 'P3 S3 L3' })
  level: string | null;

  @ApiPropertyOptional({ example: '2025 - 2026', description: 'School year title (graduation / academic year label).' })
  YearGraduation: string | null;
}
