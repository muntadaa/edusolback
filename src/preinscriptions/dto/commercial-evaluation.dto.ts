import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CommercialEvaluationDto {
  @IsOptional()
  @IsString()
  meeting_notes?: string;

  @IsOptional()
  @IsString()
  commercial_comment?: string;

  @IsOptional()
  @IsNumber()
  proposed_program_id?: number;

  @IsOptional()
  @IsNumber()
  proposed_specialization_id?: number;

  @IsOptional()
  @IsNumber()
  proposed_level_id?: number;
}

