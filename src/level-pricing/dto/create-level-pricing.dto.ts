import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateLevelPricingDto {
  @ApiProperty({ description: 'Level identifier this pricing is linked to', example: 2 })
  @Type(() => Number)
  @IsNumber()
  level_id: number;

  @ApiProperty({ description: 'Pricing title', example: 'Monthly Plan' })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiProperty({ description: 'Total amount for this plan', example: 500 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

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
