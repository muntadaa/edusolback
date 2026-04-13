import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min, ValidateIf } from 'class-validator';

export class CreateLevelPricingDto {
  @ApiProperty({ description: 'Level identifier this pricing is linked to', example: 2 })
  @Type(() => Number)
  @IsNumber()
  level_id: number;

  @ApiProperty({
    description: 'School year identifier this pricing is linked to',
    example: 7,
  })
  @Type(() => Number)
  @IsNumber()
  school_year_id: number;

  @ApiPropertyOptional({
    description: 'Rubrique identifier used as the master fee definition',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rubrique_id?: number;

  @ApiPropertyOptional({
    description: 'Optional pricing title override. If omitted, the rubrique title is used.',
    example: 'Monthly Plan',
  })
  @ValidateIf((o) => !o.rubrique_id || o.title !== undefined)
  @IsString()
  @MaxLength(150)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional amount override. If omitted, the rubrique amount is used.',
    example: 500,
  })
  @ValidateIf((o) => !o.rubrique_id || o.amount !== undefined)
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'VAT rate in percent',
    enum: [0, 20, 14, 10, 7],
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 20, 14, 10, 7])
  vat_rate?: number;

  @ApiPropertyOptional({ description: 'Number of occurrences/installments', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  occurrences?: number;

  @ApiPropertyOptional({ description: 'Flag indicating if the plan is monthly (1) or not (0)', example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  every_month?: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Status code', enum: [-2, -1, 0, 1, 2], default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([-2, -1, 0, 1, 2])
  status?: number;
}
