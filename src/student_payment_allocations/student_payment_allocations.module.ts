import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentPaymentAllocationsService } from './student_payment_allocations.service';
import { StudentPaymentAllocationsController } from './student_payment_allocations.controller';
import { StudentPaymentAllocation } from './entities/student_payment_allocation.entity';
import { StudentPayment } from '../student-payment/entities/student-payment.entity';
import { StudentPaymentDetail } from '../student_payment_details/entities/student_payment_detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentPaymentAllocation, StudentPayment, StudentPaymentDetail]),
  ],
  controllers: [StudentPaymentAllocationsController],
  providers: [StudentPaymentAllocationsService],
  exports: [StudentPaymentAllocationsService],
})
export class StudentPaymentAllocationsModule {}
