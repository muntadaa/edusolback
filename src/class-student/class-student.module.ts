import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassStudentService } from './class-student.service';
import { ClassStudentController } from './class-student.controller';
import { ClassStudent } from './entities/class-student.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { StudentAccountingModule } from '../student-accounting/student-accounting.module';
import { Program } from '../programs/entities/program.entity';
import { Specialization } from '../specializations/entities/specialization.entity';
import { Level } from '../level/entities/level.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassStudent,
      ClassEntity,
      Program,
      Specialization,
      Level,
      SchoolYear,
    ]),
    StudentAccountingModule,
  ],
  controllers: [ClassStudentController],
  providers: [ClassStudentService],
  exports: [ClassStudentService],
})
export class ClassStudentModule {}
