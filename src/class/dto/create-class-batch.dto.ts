import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateClassDto } from './create-class.dto';

export class CreateClassBatchDto {
  @ApiProperty({
    description: 'Array of classes to create',
    type: [CreateClassDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateClassDto)
  items: CreateClassDto[];
}

