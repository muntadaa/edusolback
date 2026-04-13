import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendPasswordInvitationDto {
  @ApiProperty({ description: 'User email address', example: 'jane.doe@example.com' })
  @IsEmail()
  email: string;
}
