import { Module } from '@nestjs/common';
import { StudentPaymentAllocationsService } from './student_payment_allocations.service';
import { StudentPaymentAllocationsController } from './student_payment_allocations.controller';

@Module({
  controllers: [StudentPaymentAllocationsController],
  providers: [StudentPaymentAllocationsService],
})
export class StudentPaymentAllocationsModule {}
