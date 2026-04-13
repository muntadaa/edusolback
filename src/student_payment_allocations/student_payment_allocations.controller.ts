import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentPaymentAllocationsService } from './student_payment_allocations.service';
import { StudentPaymentAllocationQueryDto } from './dto/student-payment-allocation-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Student Payment Allocations')
@ApiBearerAuth()
@Controller('student-payment-allocations')
export class StudentPaymentAllocationsController {
  constructor(private readonly studentPaymentAllocationsService: StudentPaymentAllocationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve payment allocations with pagination.' })
  findAll(@Request() req, @Query() query: StudentPaymentAllocationQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentPaymentAllocationsService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve one payment allocation.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentPaymentAllocationsService.findOne(id, companyId);
  }
}
