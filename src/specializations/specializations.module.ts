import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecializationsService } from './specializations.service';
import { SpecializationsController } from './specializations.controller';
import { Specialization } from './entities/specialization.entity';
import { Program } from '../programs/entities/program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Specialization, Program])],
  controllers: [SpecializationsController],
  providers: [SpecializationsService],
  exports: [SpecializationsService],
})
export class SpecializationsModule {}
