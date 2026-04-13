import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentPaymentService } from './student-payment.service';
import { StudentPaymentController } from './student-payment.controller';
import { StudentPayment } from './entities/student-payment.entity';
import { Student } from '../students/entities/student.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { StudentPaymentAllocation } from '../student_payment_allocations/entities/student_payment_allocation.entity';
import { StudentPaymentDetail } from '../student_payment_details/entities/student_payment_detail.entity';
import { StudentPaymentAllocationsModule } from '../student_payment_allocations/student_payment_allocations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentPayment,
      Student,
      SchoolYear,
      StudentPaymentAllocation,
      StudentPaymentDetail,
    ]),
    StudentPaymentAllocationsModule,
  ],
  controllers: [StudentPaymentController],
  providers: [StudentPaymentService],
  exports: [StudentPaymentService],
})
export class StudentPaymentModule {}
