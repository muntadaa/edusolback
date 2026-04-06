import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Max distinct student recipients per `POST /teachers/share-resource`. */
export const MAX_STUDENTS_PER_SHARE = 100;

/** Multipart fields for POST /teachers/share-resource (strings from form-data). */
export class ShareTeacherResourceDto {
  @ApiPropertyOptional({
    description: 'Single student id. Combine with student_ids; duplicates removed. At least one of student_id / student_ids required.',
    example: '42',
  })
  @IsOptional()
  @IsString()
  student_id?: string;

  @ApiPropertyOptional({
    description: `Comma- and/or whitespace-separated student ids (bulk). Max ${MAX_STUDENTS_PER_SHARE} recipients. At least one of student_id / student_ids required.`,
    example: '12,34,56',
  })
  @IsOptional()
  @IsString()
  student_ids?: string;

  @ApiProperty({ description: 'Email subject / short label', example: 'Course materials' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Optional message body (HTML-escaped in email)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Public URL to include in the email', example: 'https://example.com/doc' })
  @IsOptional()
  @IsString()
  link?: string;
}
