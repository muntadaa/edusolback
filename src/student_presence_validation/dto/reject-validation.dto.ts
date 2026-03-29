import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectValidationDto {
  @ApiProperty({
    example: 'Session note mismatch with signed attendance sheet.',
    maxLength: 4000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  rejectionReason: string;
}
