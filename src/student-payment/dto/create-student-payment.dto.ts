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

  @ApiProperty({ description: 'Amount of money received for this payment', example: 400 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

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
