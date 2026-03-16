import { PartialType } from '@nestjs/swagger';
import { CreateStudentPaymentAllocationDto } from './create-student_payment_allocation.dto';

export class UpdateStudentPaymentAllocationDto extends PartialType(CreateStudentPaymentAllocationDto) {}
