import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
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

  @ApiProperty({ description: 'End date (YYYY-MM-DD), inclusive last day of the event', example: '2026-03-20' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({
    description: 'Duration in days (min 1). If omitted, computed from start_date and end_date.',
    minimum: 1,
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duree?: number;

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

