import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, IsPositive, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSchoolYearPeriodDto {
  @ApiProperty({ description: 'Title of the school year period', example: 'Semester 1' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Start date (ISO 8601)', example: '2025-09-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date (ISO 8601)', example: '2026-01-15' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ description: 'Status indicator', example: 1 })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiPropertyOptional({ 
    description: 'Lifecycle status: planned, ongoing, or completed', 
    example: 'planned',
    enum: ['planned', 'ongoing', 'completed']
  })
  @IsOptional()
  @IsEnum(['planned', 'ongoing', 'completed'])
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';

  @ApiProperty({ description: 'Parent school year identifier', example: 7 })
  @IsInt()
  @IsPositive()
  schoolYearId: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;
}
