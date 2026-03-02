import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateStudentPaymentDto {
  @ApiProperty({ description: 'Student identifier', example: 105 })
  @Type(() => Number)
  @IsNumber()
  student_id: number;

  @ApiProperty({ description: 'School year identifier', example: 3 })
  @Type(() => Number)
  @IsNumber()
  school_year_id: number;

  @ApiProperty({ description: 'Level identifier related to the payment', example: 2 })
  @Type(() => Number)
  @IsNumber()
  level_id: number;

  @ApiPropertyOptional({ description: 'Level pricing identifier used for this payment', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  level_pricing_id?: number;

  @ApiProperty({ description: 'Total amount expected', example: 1200 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Amount currently paid', example: 400 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  payment: number;

  @ApiProperty({ description: 'Payment date', example: '2025-01-10' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Payment mode', example: 'Cash' })
  @IsString()
  @MaxLength(50)
  mode: string;

  @ApiPropertyOptional({ description: 'Payment reference', example: 'TXN-85923' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
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
