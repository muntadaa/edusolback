import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsOptional()
  @IsString({ message: 'Label must be a string' })
  @MaxLength(255, { message: 'Label must not exceed 255 characters' })
  label?: string;
}
