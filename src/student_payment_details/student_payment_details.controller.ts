import {
  BadRequestException,
  Body as BodyDecorator,
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
import { StudentPaymentReminderDto } from './dto/student-payment-reminder.dto';
import { SyncLevelPricingDto } from './dto/sync-level-pricing.dto';
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

  @Post('sync-level-pricing')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'Generate missing bills for students in a level (and optional school year) after level pricing/rubrique updates.',
  })
  syncLevelPricing(@Request() req, @BodyDecorator() dto: SyncLevelPricingDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentAccountingService.syncByLevelPricingUpdate(
      dto.level_id,
      companyId,
      dto.school_year_id,
    );
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

  @Get('debtors')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'List students with remaining balance (aggregated per student: total_due, total_allocated, total_remaining).',
  })
  getDebtors(@Request() req, @Query() query: StudentPaymentDetailQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentPaymentDetailsService.getDebtors(query, companyId);
  }

  @Post('payment-reminders')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'Send payment reminder emails to one or more students based on their remaining balances.',
  })
  sendPaymentReminders(@Request() req, @BodyDecorator() dto: StudentPaymentReminderDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    return this.studentPaymentDetailsService.sendPaymentReminders(dto, companyId);
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
