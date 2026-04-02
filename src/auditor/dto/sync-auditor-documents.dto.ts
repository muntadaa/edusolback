import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SyncAuditorDocumentsDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  student_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  program_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specialization_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level_id: number;
}
