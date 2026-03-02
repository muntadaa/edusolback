import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsDateString, IsInt, IsOptional, Min, Max, IsNumber, IsEnum } from 'class-validator';

export class CreateSchoolYearDto {
  @ApiProperty({ description: 'School year title', example: '2025-2026' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Start date (ISO 8601)', example: '2025-09-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date (ISO 8601)', example: '2026-06-30' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ 
    description: 'Lifecycle status: planned, ongoing, or completed', 
    example: 'planned',
    enum: ['planned', 'ongoing', 'completed']
  })
  @IsOptional()
  @IsEnum(['planned', 'ongoing', 'completed'])
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @IsInt()
  companyId?: number;
}
