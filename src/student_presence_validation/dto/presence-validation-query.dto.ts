import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { StudentPresenceValidationStatus } from '../entities/student_presence_validation.entity';

export class PresenceValidationQueryDto {
  @ApiPropertyOptional({
    enum: StudentPresenceValidationStatus,
    default: StudentPresenceValidationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(StudentPresenceValidationStatus)
  status?: StudentPresenceValidationStatus;

  @ApiPropertyOptional({ example: 10, description: 'Filter by session/planning id.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  session_id?: number;
}
