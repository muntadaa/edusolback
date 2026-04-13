import { PartialType } from '@nestjs/swagger';
import { CreatePreinscriptionDto } from './create-preinscription.dto';

export class UpdatePreinscriptionDto extends PartialType(CreatePreinscriptionDto) {}
