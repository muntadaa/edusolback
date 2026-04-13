import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class SyncLevelPricingDto {
  @ApiProperty({ example: 3, description: 'Level ID to sync missing bills for.' })
  @Type(() => Number)
  @IsNumber()
  level_id: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Optional school year filter. If omitted, syncs across all years for this level.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_year_id?: number;
}

