import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreinscriptionsService } from './preinscriptions.service';
import { PreinscriptionsController } from './preinscriptions.controller';
import { PreInscription } from './entities/preinscription.entity';
import { Company } from '../company/entities/company.entity';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [TypeOrmModule.forFeature([PreInscription, Company]), StudentsModule],
  controllers: [PreinscriptionsController],
  providers: [PreinscriptionsService],
})
export class PreinscriptionsModule {}
