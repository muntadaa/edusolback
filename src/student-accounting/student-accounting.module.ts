import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAccountingService } from './student-accounting.service';
import { Student } from '../students/entities/student.entity';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { LevelPricing } from '../level-pricing/entities/level-pricing.entity';
import { StudentPaymentDetail } from '../student_payment_details/entities/student_payment_detail.entity';
import { StudentPayment } from '../student-payment/entities/student-payment.entity';
import { StudentPaymentAllocationsModule } from '../student_payment_allocations/student_payment_allocations.module';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { Level } from '../level/entities/level.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      ClassStudent,
      ClassEntity,
      SchoolYear,
      Level,
      LevelPricing,
      StudentPaymentDetail,
      StudentPayment,
    ]),
    StudentPaymentAllocationsModule,
  ],
  providers: [StudentAccountingService],
  exports: [StudentAccountingService],
})
export class StudentAccountingModule {}
