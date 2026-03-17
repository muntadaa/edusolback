import { PartialType } from '@nestjs/swagger';
import { CreatePreInscriptionDiplomaDto } from './create-pre-inscription-diploma.dto';

export class UpdatePreInscriptionDiplomaDto extends PartialType(CreatePreInscriptionDiplomaDto) {}
