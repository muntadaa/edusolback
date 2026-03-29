import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StudentPresenceValidationStatus } from '../entities/student_presence_validation.entity';

export class UpdateValidationStatusDto {
  @ApiProperty({
    enum: [StudentPresenceValidationStatus.APPROVED, StudentPresenceValidationStatus.REJECTED],
    example: StudentPresenceValidationStatus.APPROVED,
  })
  @IsEnum(StudentPresenceValidationStatus)
  status: StudentPresenceValidationStatus.APPROVED | StudentPresenceValidationStatus.REJECTED;

  @ApiPropertyOptional({ example: 'Out-of-scope note edit detected.', maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rejectionReason?: string;
}
