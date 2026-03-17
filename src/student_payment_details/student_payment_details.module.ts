import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentPaymentDetailsService } from './student_payment_details.service';
import { StudentPaymentDetailsController } from './student_payment_details.controller';
import { StudentPaymentDetail } from './entities/student_payment_detail.entity';
import { StudentPaymentAllocation } from '../student_payment_allocations/entities/student_payment_allocation.entity';
import { StudentAccountingModule } from '../student-accounting/student-accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentPaymentDetail, StudentPaymentAllocation]),
    StudentAccountingModule,
  ],
  controllers: [StudentPaymentDetailsController],
  providers: [StudentPaymentDetailsService],
  exports: [StudentPaymentDetailsService],
})
export class StudentPaymentDetailsModule {}
