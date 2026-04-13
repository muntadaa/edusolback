import { IsString, IsNotEmpty, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VerifyCaptchaDto {
  @ApiProperty({
    description: 'CAPTCHA token received from generate endpoint',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @ApiProperty({
    description: 'User answer to the CAPTCHA challenge',
    example: 8,
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  @IsNotEmpty({ message: 'Answer is required' })
  answer: string | number;
}
