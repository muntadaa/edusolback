import { Injectable } from '@nestjs/common';
import { CreateStudentPaymentAllocationDto } from './dto/create-student_payment_allocation.dto';
import { UpdateStudentPaymentAllocationDto } from './dto/update-student_payment_allocation.dto';

@Injectable()
export class StudentPaymentAllocationsService {
  create(createStudentPaymentAllocationDto: CreateStudentPaymentAllocationDto) {
    return 'This action adds a new studentPaymentAllocation';
  }

  findAll() {
    return `This action returns all studentPaymentAllocations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentPaymentAllocation`;
  }

  update(id: number, updateStudentPaymentAllocationDto: UpdateStudentPaymentAllocationDto) {
    return `This action updates a #${id} studentPaymentAllocation`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentPaymentAllocation`;
  }
}
