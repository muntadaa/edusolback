import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsNumber, IsDateString, Min, Max, IsString } from 'class-validator';

export class CreateStudentAttestationDto {
  @ApiProperty({ description: 'Student identifier', example: 1 })
  @IsInt()
  Idstudent: number;

  @ApiProperty({ description: 'Attestation identifier', example: 1 })
  @IsInt()
  Idattestation: number;

  @ApiPropertyOptional({ description: 'Date when attestation was requested (ISO 8601)', example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  dateask?: string;

  @ApiPropertyOptional({ description: 'Date when attestation was delivered (ISO 8601)', example: '2025-01-20' })
  @IsOptional()
  @IsDateString()
  datedelivery?: string;

  @ApiPropertyOptional({ description: 'Optional notes about the attestation request', example: 'Urgent delivery requested' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Status indicator: 0=disabled, 1=active, 2=pending, -1=archiver, -2=deleted', 
    example: 1,
    enum: [-2, -1, 0, 1, 2]
  })
  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  Status?: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @IsInt()
  companyid?: number;
}
