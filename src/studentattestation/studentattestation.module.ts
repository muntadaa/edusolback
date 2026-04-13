import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentattestationService } from './studentattestation.service';
import { StudentattestationController } from './studentattestation.controller';
import { StudentAttestation } from './entities/studentattestation.entity';
import { Student } from '../students/entities/student.entity';
import { Attestation } from '../attestation/entities/attestation.entity';
import { Company } from '../company/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentAttestation, Student, Attestation, Company])],
  controllers: [StudentattestationController],
  providers: [StudentattestationService],
  exports: [StudentattestationService],
})
export class StudentattestationModule {}
