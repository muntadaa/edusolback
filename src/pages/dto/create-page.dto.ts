import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class CreatePageDto {
  @ApiProperty({ description: 'Page title', example: 'Finance Dashboard' })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @ApiProperty({ description: 'Page route (must start with /)', example: '/finance' })
  @IsString({ message: 'Route must be a string' })
  @IsNotEmpty({ message: 'Route is required' })
  @Matches(/^\//, { message: 'Route must start with /' })
  @MaxLength(255, { message: 'Route must not exceed 255 characters' })
  route: string;
}

