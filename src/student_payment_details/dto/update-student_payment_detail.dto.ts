import { PartialType } from '@nestjs/swagger';
import { CreateStudentPaymentDetailDto } from './create-student_payment_detail.dto';

export class UpdateStudentPaymentDetailDto extends PartialType(CreateStudentPaymentDetailDto) {}
