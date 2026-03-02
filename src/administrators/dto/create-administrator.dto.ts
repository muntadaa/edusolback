import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdministratorDto {
  @ApiPropertyOptional({ description: 'Gender of the administrator', example: 'female' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Given name', example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ description: 'Family name', example: 'Johnson' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({ description: 'Date of birth (ISO 8601)', example: '1990-05-21' })
  @IsOptional()
  @IsDateString()
  birthday?: string; // ISO date (YYYY-MM-DD)

  @ApiProperty({ description: 'Work email address', example: 'alice.johnson@school.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Direct phone number', example: '+1-555-0100' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Mailing address', example: '123 Elm Street' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City of residence', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Country of residence', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Nationality of the administrator', example: 'American' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Profile picture path stored after upload', example: '/uploads/administrators/1700000000000_avatar.png' })
  @IsOptional()
  picture?: string;

  @ApiPropertyOptional({ description: 'Linked company identifier', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Managed classroom identifier', example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_room_id?: number;

  @ApiPropertyOptional({ description: 'Status flag (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;
}
