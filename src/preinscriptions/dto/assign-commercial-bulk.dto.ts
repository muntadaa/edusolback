import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCommercialBulkDto {
  @ApiProperty({ example: 5, description: 'User ID of the commercial to assign.' })
  @IsNumber()
  @Type(() => Number)
  commercialId: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Pre-inscription IDs to assign to this commercial.',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one preinscription ID is required' })
  @IsNumber({}, { each: true })
  @Type(() => Number)
  preinscriptionIds: number[];
}
