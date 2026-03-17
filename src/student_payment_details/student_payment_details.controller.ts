import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentPaymentDetailsService } from './student_payment_details.service';
import { StudentPaymentDetailQueryDto } from './dto/student-payment-detail-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentAccountingService } from '../student-accounting/student-accounting.service';

@ApiTags('Student Payment Details')
@ApiBearerAuth()
@Controller('student-payment-details')
export class StudentPaymentDetailsController {
  constructor(
    private readonly studentPaymentDetailsService: StudentPaymentDetailsService,
    private readonly studentAccountingService: StudentAccountingService,
  ) {}

  @Post('generate/:studentId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Generate missing obligations for a student.' })
  generate(@Request() req, @Param('studentId', ParseIntPipe) studentId: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentAccountingService.syncStudentObligations(studentId, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve ledger lines with balances.' })
  findAll(@Request() req, @Query() query: StudentPaymentDetailQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentPaymentDetailsService.findAll(query, companyId);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve ledger totals summary.' })
  getSummary(@Request() req, @Query() query: StudentPaymentDetailQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentPaymentDetailsService.getSummary(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve one ledger line with balances.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentPaymentDetailsService.findOne(id, companyId);
  }
}
