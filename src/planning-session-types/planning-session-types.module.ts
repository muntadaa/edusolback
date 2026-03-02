import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningSessionTypesService } from './planning-session-types.service';
import { PlanningSessionTypesController } from './planning-session-types.controller';
import { PlanningSessionType } from './entities/planning-session-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanningSessionType])],
  controllers: [PlanningSessionTypesController],
  providers: [PlanningSessionTypesService],
  exports: [PlanningSessionTypesService],
})
export class PlanningSessionTypesModule {}
