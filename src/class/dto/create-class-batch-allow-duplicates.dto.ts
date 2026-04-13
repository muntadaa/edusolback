import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateClassDto } from './create-class.dto';

export class CreateClassBatchAllowDuplicatesDto {
  @ApiProperty({
    description:
      'One new class row per item (duplicates by school_year + level allowed). Omit `status` → default **2** (pending). Use POST /classes/batch when you want to skip existing same year+level.',
    type: [CreateClassDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateClassDto)
  items: CreateClassDto[];
}
