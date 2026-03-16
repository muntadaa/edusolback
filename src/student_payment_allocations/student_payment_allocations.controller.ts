import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentPaymentAllocationsService } from './student_payment_allocations.service';
import { CreateStudentPaymentAllocationDto } from './dto/create-student_payment_allocation.dto';
import { UpdateStudentPaymentAllocationDto } from './dto/update-student_payment_allocation.dto';

@Controller('student-payment-allocations')
export class StudentPaymentAllocationsController {
  constructor(private readonly studentPaymentAllocationsService: StudentPaymentAllocationsService) {}

  @Post()
  create(@Body() createStudentPaymentAllocationDto: CreateStudentPaymentAllocationDto) {
    return this.studentPaymentAllocationsService.create(createStudentPaymentAllocationDto);
  }

  @Get()
  findAll() {
    return this.studentPaymentAllocationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentPaymentAllocationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentPaymentAllocationDto: UpdateStudentPaymentAllocationDto) {
    return this.studentPaymentAllocationsService.update(+id, updateStudentPaymentAllocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentPaymentAllocationsService.remove(+id);
  }
}
