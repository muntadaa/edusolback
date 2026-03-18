import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePreinscriptionMeetingDto {
  @ApiProperty({
    example: '2025-03-15T14:30:00',
    description: 'Date and time of the meeting (ISO 8601, e.g. YYYY-MM-DDTHH:mm:ss or with timezone).',
  })
  @IsDateString()
  meeting_at: string;

  @ApiProperty({ example: 'Discussed program options and level.', required: false })
  @IsOptional()
  @IsString()
  meeting_notes?: string;
}
