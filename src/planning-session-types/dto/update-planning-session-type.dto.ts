import { PartialType } from '@nestjs/swagger';
import { CreatePlanningSessionTypeDto } from './create-planning-session-type.dto';

export class UpdatePlanningSessionTypeDto extends PartialType(CreatePlanningSessionTypeDto) {}
