import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateLevelPricingDto } from './create-level-pricing.dto';

export class CreateLevelPricingBatchDto {
  @ApiProperty({
    description: 'Array of level pricings to create',
    type: [CreateLevelPricingDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLevelPricingDto)
  items: CreateLevelPricingDto[];
}

