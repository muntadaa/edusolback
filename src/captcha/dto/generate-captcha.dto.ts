import { ApiProperty } from '@nestjs/swagger';

export class GenerateCaptchaResponseDto {
  @ApiProperty({
    description: 'Unique CAPTCHA token for verification',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  token: string;

  @ApiProperty({
    description: '5-character alphanumeric sequence to display in the grid',
    example: 'A3B7K',
  })
  characters: string;

  @ApiProperty({
    description: 'Column index (0-4) where characters should be displayed in row 1',
    example: 2,
    minimum: 0,
    maximum: 4,
  })
  charactersColumn: number;

  @ApiProperty({
    description: 'Column index (0-4) where input field should be placed in row 2',
    example: 4,
    minimum: 0,
    maximum: 4,
  })
  inputColumn: number;

  @ApiProperty({
    description: 'Type of CAPTCHA challenge',
    example: 'grid',
    enum: ['grid'],
  })
  type: string;
}
