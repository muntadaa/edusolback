import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentPaymentService } from './student-payment.service';
import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';
import { UpdateStudentPaymentDto } from './dto/update-student-payment.dto';
import { StudentPaymentQueryDto } from './dto/student-payment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Student Payments')
@ApiBearerAuth()
@Controller('student-payments')
export class StudentPaymentController {
  constructor(private readonly studentPaymentService: StudentPaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Student payment created successfully.' })
  create(@Request() req, @Body() dto: CreateStudentPaymentDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPaymentService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve student payments with pagination metadata.' })
  findAll(@Request() req, @Query() query: StudentPaymentQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPaymentService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a student payment by identifier.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPaymentService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a student payment.' })
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentPaymentDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPaymentService.update(id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a student payment (sets status to -2).' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPaymentService.remove(id, companyId);
  }
}
