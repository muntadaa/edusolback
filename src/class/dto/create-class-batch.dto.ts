import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateClassDto } from './create-class.dto';

export class CreateClassBatchDto {
  @ApiProperty({
    description:
      'Array of classes to create in one transaction. Omit `status` on each item → default **2** (pending). Same school_year_id + level_id as an existing (non-deleted) class: no new row, existing class is returned for that item. Repeated keys in this array share one insert.',
    type: [CreateClassDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateClassDto)
  items: CreateClassDto[];
}

