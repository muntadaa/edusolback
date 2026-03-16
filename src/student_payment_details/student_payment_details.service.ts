import { Injectable } from '@nestjs/common';
import { CreateStudentPaymentDetailDto } from './dto/create-student_payment_detail.dto';
import { UpdateStudentPaymentDetailDto } from './dto/update-student_payment_detail.dto';

@Injectable()
export class StudentPaymentDetailsService {
  create(createStudentPaymentDetailDto: CreateStudentPaymentDetailDto) {
    return 'This action adds a new studentPaymentDetail';
  }

  findAll() {
    return `This action returns all studentPaymentDetails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentPaymentDetail`;
  }

  update(id: number, updateStudentPaymentDetailDto: UpdateStudentPaymentDetailDto) {
    return `This action updates a #${id} studentPaymentDetail`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentPaymentDetail`;
  }
}
