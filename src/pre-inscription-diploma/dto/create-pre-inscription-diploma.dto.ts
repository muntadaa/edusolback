import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePreInscriptionDiplomaDto {
  @ApiProperty({ maxLength: 255, example: 'Licence en Informatique' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'Université Hassan II' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  school?: string | null;

  @ApiPropertyOptional({ maxLength: 255, example: 'Licence en Informatique' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  diplome?: string | null;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  annee?: number | null;

  @ApiPropertyOptional({ maxLength: 255, example: 'Morocco' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  country?: string | null;

  @ApiPropertyOptional({ maxLength: 255, example: 'Casablanca' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string | null;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  diplome_picture_1?: string | null;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  diplome_picture_2?: string | null;

  // Legacy aliases for backward compatibility.
  @ApiPropertyOptional({ maxLength: 255, deprecated: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  diploma_name?: string;

  @ApiPropertyOptional({ maxLength: 255, deprecated: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  institution?: string | null;

  @ApiPropertyOptional({ example: 2024, deprecated: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number | null;

  @ApiProperty({ description: 'Associated pre-inscription identifier', example: 21 })
  @Type(() => Number)
  @IsNumber()
  preinscription_id: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;
}

