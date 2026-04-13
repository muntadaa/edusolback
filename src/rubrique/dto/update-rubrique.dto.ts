import { PartialType } from '@nestjs/swagger';
import { CreateRubriqueDto } from './create-rubrique.dto';

export class UpdateRubriqueDto extends PartialType(CreateRubriqueDto) {}
