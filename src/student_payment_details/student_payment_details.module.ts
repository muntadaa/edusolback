import { Module } from '@nestjs/common';
import { StudentPaymentDetailsService } from './student_payment_details.service';
import { StudentPaymentDetailsController } from './student_payment_details.controller';

@Module({
  controllers: [StudentPaymentDetailsController],
  providers: [StudentPaymentDetailsService],
})
export class StudentPaymentDetailsModule {}
