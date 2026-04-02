import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CreateCommercialPreinscriptionDto } from './create-commercial-preinscription.dto';

/**
 * Same body as commercial Excel import plus optional level.
 * If level_id is invalid, the pre-inscription is still created; see response `level_validation_error`.
 */
export class CreateCommercialPreinscriptionWithLevelDto extends CreateCommercialPreinscriptionDto {
  @ApiPropertyOptional({
    description:
      'Optional level id for this company. When valid, proposed_program_id / proposed_specialization_id / proposed_level_id are set. When invalid or missing, row is still created without those fields.',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level_id?: number;
}
