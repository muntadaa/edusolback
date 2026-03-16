import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateRubriqueDto {
  @ApiProperty({ description: 'Rubrique title', example: 'Registration fee' })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiProperty({ description: 'Amount for this rubrique', example: 500 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

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

  @ApiPropertyOptional({ description: 'Flag indicating if the rubrique is monthly (1) or not (0)', example: 1, default: 0 })
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

