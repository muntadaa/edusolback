import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

/** Scholarity edits the canonical row on `student_presence` while validation is still `pending`. */
export class UpdatePresenceValidationNoteDto {
  @ApiPropertyOptional({ example: 14.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  note?: number;

  @ApiPropertyOptional({ example: 'Adjusted after review', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  remarks?: string;
}
