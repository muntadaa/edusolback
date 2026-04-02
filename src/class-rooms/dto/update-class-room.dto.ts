import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateClassRoomDto } from './create-class-room.dto';

class UpdateClassRoomDtoBase extends PartialType(OmitType(CreateClassRoomDto, ['capacity'] as const)) {}

export class UpdateClassRoomDto extends UpdateClassRoomDtoBase {
  @ApiPropertyOptional({ nullable: true, description: 'Omit to leave unchanged; null to clear capacity' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity?: number | null;
}
