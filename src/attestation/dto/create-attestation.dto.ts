import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateAttestationDto {
  @ApiProperty({ description: 'Attestation title', example: 'Certificate of Completion' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Attestation description', example: 'This certificate confirms the completion of the course.' })
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
  statut?: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @IsInt()
  companyid?: number;
}
