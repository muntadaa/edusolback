import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignRolePageDto {
  @ApiProperty({ description: 'Role ID', example: 1 })
  @IsNumber({}, { message: 'Role ID must be a number' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Role ID is required' })
  role_id: number;

  @ApiProperty({ description: 'Page ID', example: 1 })
  @IsNumber({}, { message: 'Page ID must be a number' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Page ID is required' })
  page_id: number;
}
