import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncManyPreinscriptionsDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of pre-inscription IDs to sync into students/users',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}

