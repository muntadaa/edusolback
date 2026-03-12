import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePreinscriptionDto {
  @ApiProperty({ example: 'John', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  first_name: string;

  @ApiProperty({ example: 'Doe', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  last_name: string;

  @ApiProperty({ example: '+212612345678', description: 'WhatsApp phone number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  whatsapp_phone: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Moroccan', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nationality: string;

  @ApiProperty({ example: 'Casablanca', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string;

  @ApiProperty({
    example: 'Licence en Informatique',
    description: 'Current diploma or formation',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  current_formation: string;

  @ApiProperty({
    description: 'Desired formation choice (free text; frontend can constrain to a list)',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  desired_formation: string;

  @ApiPropertyOptional({
    description: 'How did they know the school? (free text; frontend can constrain to a list)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  how_known?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Owning company identifier (optional when using publicToken endpoint).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  company_id?: number;
}
