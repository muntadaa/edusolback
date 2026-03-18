import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreinscriptionMeetingDto {
  @ApiProperty({ example: '2025-03-15T14:30:00', required: false })
  @IsOptional()
  @IsDateString()
  meeting_at?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meeting_notes?: string;
}
