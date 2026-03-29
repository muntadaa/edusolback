import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentPresenceValidationService } from './student_presence_validation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RouteAccessGuard } from '../auth/guards/route-access.guard';
import { RequirePageRoute } from '../common/decorators/require-page-route.decorator';
import { PresenceValidationQueryDto } from './dto/presence-validation-query.dto';
import { RejectValidationDto } from './dto/reject-validation.dto';
import { UpdatePresenceValidationNoteDto } from './dto/update-presence-validation-note.dto';

/**
 * Must match a `pages.route` value that is assigned (via role_pages) to every role
 * allowed to approve/reject on the Courses & notes UI. Override with env if your app uses another path.
 */
const PRESENCE_VALIDATION_PAGE_ROUTE =
  process.env.COURSES_NOTES_PAGE_ROUTE?.trim() || '/student-notes';

@ApiTags('Student Presence Validation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('presence-validations')
export class StudentPresenceValidationController {
  constructor(private readonly studentPresenceValidationService: StudentPresenceValidationService) {}

  @Get()
  @ApiOkResponse({
    description:
      'List validation rows scoped to the user company (join on student_presence). Any authenticated user can read; approve/reject remain scholarity/admin only. Default status filter: pending.',
  })
  findAll(@Request() req, @Query() query: PresenceValidationQueryDto) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceValidationService.findAll(query, companyId);
  }

  @Patch(':id/note')
  @UseGuards(RouteAccessGuard)
  @RequirePageRoute(PRESENCE_VALIDATION_PAGE_ROUTE)
  @ApiResponse({
    status: 200,
    description:
      'Updates `student_presence.note` and/or `remarks` while validation is `pending`. Same page access as approve/reject.',
  })
  updateNote(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePresenceValidationNoteDto,
  ) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceValidationService.updatePendingNote(id, companyId, dto);
  }

  @Patch(':id/approve')
  @UseGuards(RouteAccessGuard)
  @RequirePageRoute(PRESENCE_VALIDATION_PAGE_ROUTE)
  @ApiResponse({
    status: 200,
    description:
      'Validation approved. Caller must have access to the Courses & notes page route (see COURSES_NOTES_PAGE_ROUTE).',
  })
  approve(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user?.company_id;
    const validatorUserId = req.user?.id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!validatorUserId) {
      throw new BadRequestException('Invalid authenticated user');
    }
    return this.studentPresenceValidationService.approve(id, companyId, validatorUserId);
  }

  @Patch(':id/reject')
  @UseGuards(RouteAccessGuard)
  @RequirePageRoute(PRESENCE_VALIDATION_PAGE_ROUTE)
  @ApiResponse({
    status: 200,
    description:
      'Validation rejected. Caller must have access to the Courses & notes page route (see COURSES_NOTES_PAGE_ROUTE).',
  })
  reject(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectValidationDto,
  ) {
    const companyId = req.user?.company_id;
    const validatorUserId = req.user?.id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!validatorUserId) {
      throw new BadRequestException('Invalid authenticated user');
    }
    return this.studentPresenceValidationService.reject(
      id,
      companyId,
      validatorUserId,
      dto.rejectionReason,
    );
  }
}
