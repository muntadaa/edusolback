import { PartialType } from '@nestjs/swagger';
import { CreateLevelPricingDto } from './create-level-pricing.dto';

export class UpdateLevelPricingDto extends PartialType(CreateLevelPricingDto) {}
