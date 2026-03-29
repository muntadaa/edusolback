import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateStudentPresenceValidationDto {
  @ApiProperty({ example: 123 })
  @IsInt()
  @Min(1)
  student_presence_id: number;
}
