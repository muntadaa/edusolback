import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Unique role code identifier', example: 'admin' })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @MaxLength(100, { message: 'Code must not exceed 100 characters' })
  code: string;

  @ApiProperty({ description: 'Human readable role name', example: 'Administrator' })
  @IsString({ message: 'Label must be a string' })
  @IsNotEmpty({ message: 'Label is required' })
  @MaxLength(255, { message: 'Label must not exceed 255 characters' })
  label: string;

  @ApiProperty({ description: 'Whether this is a system role (cannot be deleted)', example: false, required: false })
  @IsOptional()
  @IsBoolean({ message: 'is_system must be a boolean' })
  is_system?: boolean;
}
