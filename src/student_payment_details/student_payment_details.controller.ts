import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentPaymentDetailsService } from './student_payment_details.service';
import { CreateStudentPaymentDetailDto } from './dto/create-student_payment_detail.dto';
import { UpdateStudentPaymentDetailDto } from './dto/update-student_payment_detail.dto';

@Controller('student-payment-details')
export class StudentPaymentDetailsController {
  constructor(private readonly studentPaymentDetailsService: StudentPaymentDetailsService) {}

  @Post()
  create(@Body() createStudentPaymentDetailDto: CreateStudentPaymentDetailDto) {
    return this.studentPaymentDetailsService.create(createStudentPaymentDetailDto);
  }

  @Get()
  findAll() {
    return this.studentPaymentDetailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentPaymentDetailsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentPaymentDetailDto: UpdateStudentPaymentDetailDto) {
    return this.studentPaymentDetailsService.update(+id, updateStudentPaymentDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentPaymentDetailsService.remove(+id);
  }
}
