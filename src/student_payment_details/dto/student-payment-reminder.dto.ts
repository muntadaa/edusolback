import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentPaymentReminderDto {
  @ApiProperty({
    description: 'List of student IDs to send reminders to',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  studentIds: number[];

  @ApiProperty({
    description: 'Optional school year filter; if provided, reminders are based only on this year.',
    required: false,
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number;
}

