import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AuditorDocumentStatus } from '../enums/auditor-document-status.enum';

export class AuditorDocumentsQueryDto {
  @ApiProperty({ description: 'Student to list auditor rows for.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  student_id: number;

  @ApiPropertyOptional({ enum: AuditorDocumentStatus })
  @IsOptional()
  @IsEnum(AuditorDocumentStatus)
  status?: AuditorDocumentStatus;
}
