import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventType } from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({ description: 'Event title', maxLength: 255, example: 'Mid-term exams' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Event description', example: 'Exams for all classes in semester 1' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', example: '2026-03-15' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', example: '2026-03-20' })
  @IsDateString()
  end_date: string;

  @ApiProperty({
    description: 'Event type',
    enum: EventType,
    example: EventType.EXAM,
  })
  @IsEnum(EventType)
  type: EventType;

  @ApiPropertyOptional({ description: 'Whether this event blocks other operations (e.g. planning)', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_blocking?: boolean = true;
}

