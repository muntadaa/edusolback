import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException, ParseIntPipe, UseInterceptors, UploadedFile, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { PreinscriptionsService } from './preinscriptions.service';
import { CreatePreinscriptionDto } from './dto/create-preinscription.dto';
import { UpdatePreinscriptionDto } from './dto/update-preinscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PreinscriptionsQueryDto } from './dto/preinscriptions-query.dto';
import { SyncManyPreinscriptionsDto } from './dto/sync-many-preinscriptions.dto';
import { AdminDecisionDto } from './dto/admin-decision.dto';
import { CommercialEvaluationDto } from './dto/commercial-evaluation.dto';
import { AssignCommercialBulkDto } from './dto/assign-commercial-bulk.dto';
import { CreatePreinscriptionMeetingDto } from './dto/create-preinscription-meeting.dto';
import { UpdatePreinscriptionMeetingDto } from './dto/update-preinscription-meeting.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Preinscriptions')
@ApiBearerAuth()
@Controller('preinscriptions')
export class PreinscriptionsController {
  constructor(private readonly preinscriptionsService: PreinscriptionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Pre-inscription created successfully.' })
  create(@Request() req, @Body() createPreinscriptionDto: CreatePreinscriptionDto) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    // Force company_id from authenticated user (ignore any incoming company_id)
    return this.preinscriptionsService.create({
      ...createPreinscriptionDto,
      company_id: companyId,
    });
  }

  /**
   * Public endpoint used from the pre-inscription form before any user is connected.
   * The company is resolved using its publicToken.
   */
  @Post('public/:publicToken')
  @ApiResponse({
    status: 201,
    description:
      'Public pre-inscription created successfully using the company publicToken.',
  })
  createPublic(
    @Param('publicToken') publicToken: string,
    @Body() createPreinscriptionDto: CreatePreinscriptionDto,
  ) {
    return this.preinscriptionsService.createForPublicToken(
      publicToken,
      createPreinscriptionDto,
    );
  }

  /**
   * Public endpoint: fetch an existing pre-inscription by company publicToken and student email.
   * Frontend can use this to pre-fill the registration form and then create the student/user
   * if they do not already exist.
   */
  @Get('public/:publicToken')
  @ApiQuery({
    name: 'email',
    required: true,
    description: 'Student email used during pre-inscription.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Pre-inscription found for this company and email. Use the returned data to pre-fill the registration form.',
  })
  findPublicByEmail(
    @Param('publicToken') publicToken: string,
    @Query('email') email: string,
  ) {
    return this.preinscriptionsService.findByPublicTokenAndEmail(
      publicToken,
      email,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'List all pre-inscriptions.' })
  findAll(@Request() req, @Query() query: PreinscriptionsQueryDto) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preinscriptionsService.findAllByCompany(query, companyId);
  }

  @Get('eligible-commercial-users')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'List users eligible for commercial assignment (have page access to /preinscriptions/commercial).',
  })
  getEligibleCommercialUsers(@Request() req) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preinscriptionsService.getEligibleCommercialUsers(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Get a single pre-inscription by id.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preinscriptionsService.findOneByCompany(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a pre-inscription.' })
  update(@Request() req, @Param('id') id: string, @Body() updatePreinscriptionDto: UpdatePreinscriptionDto) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preinscriptionsService.updateByCompany(+id, companyId, updatePreinscriptionDto);
  }

  @Patch(':id/assign-commercial')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Assign a commercial agent to this pre-inscription.' })
  assignCommercial(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { commercialId: number },
  ) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.preinscriptionsService.assignCommercial(+id, body.commercialId);
  }

  @Post('assign-commercial-bulk')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 201,
    description:
      'Assign one commercial to multiple pre-inscriptions. Returns assigned ids and per-id failures.',
  })
  assignCommercialBulk(@Request() req, @Body() dto: AssignCommercialBulkDto) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.preinscriptionsService.assignCommercialBulk(
      dto.commercialId,
      dto.preinscriptionIds,
      companyId,
    );
  }

  @Get(':id/meetings')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'List all meetings for this pre-inscription (date + notes).' })
  getMeetings(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.preinscriptionsService.findMeetingsByPreinscription(id, companyId);
  }

  @Post(':id/meetings')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Add a meeting (date + meeting notes) for this pre-inscription.' })
  createMeeting(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePreinscriptionMeetingDto,
  ) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.preinscriptionsService.createMeeting(id, companyId, dto);
  }

  @Patch(':id/meetings/:meetingId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a meeting (date and/or notes).' })
  updateMeeting(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('meetingId', ParseIntPipe) meetingId: number,
    @Body() dto: UpdatePreinscriptionMeetingDto,
  ) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.preinscriptionsService.updateMeeting(id, meetingId, companyId, dto);
  }

  @Delete(':id/meetings/:meetingId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Delete a meeting.' })
  removeMeeting(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('meetingId', ParseIntPipe) meetingId: number,
  ) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.preinscriptionsService.removeMeeting(id, meetingId, companyId);
  }

  @Patch(':id/commercial-evaluation')
  @ApiResponse({ status: 200, description: 'Update commercial evaluation fields and move to COMMERCIAL_REVIEW.' })
  updateCommercialEvaluation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CommercialEvaluationDto,
  ) {
    return this.preinscriptionsService.updateCommercialEvaluation(id, dto);
  }

  /**
   * Used by Commercial when evaluation is finished.
   * Modifies state (workflow transition).
   */
  @Patch(':id/submit')
  @ApiResponse({ status: 200, description: 'Submit pre-inscription to administration for decision.' })
  submitToAdministration(@Param('id', ParseIntPipe) id: number) {
    return this.preinscriptionsService.submitToAdministration(id);
  }

  /**
   * Used by Administrator.
   */
  @Patch(':id/admin-decision')
  @ApiResponse({ status: 200, description: 'Admin decision: approve or reject the pre-inscription.' })
  adminDecision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminDecisionDto,
  ) {
    return this.preinscriptionsService.adminDecision(id, dto);
  }

  @Patch(':id/student-data/commercial')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Commercial: update student personal data in allowed workflow phases.' })
  updateStudentDataCommercial(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePreinscriptionDto,
  ) {
    const companyId = req.user?.company_id;
    const actorId = req.user?.id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    if (!actorId) throw new BadRequestException('User id is required');
    return this.preinscriptionsService.updateStudentDataInPhase(
      id,
      companyId,
      dto,
      actorId,
      'commercial',
    );
  }

  @Patch(':id/student-data/admin')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Admin: update student personal data in allowed workflow phases.' })
  updateStudentDataAdmin(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePreinscriptionDto,
  ) {
    const companyId = req.user?.company_id;
    const actorId = req.user?.id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    if (!actorId) throw new BadRequestException('User id is required');
    return this.preinscriptionsService.updateStudentDataInPhase(
      id,
      companyId,
      dto,
      actorId,
      'admin',
    );
  }

  @Patch(':id/picture/commercial')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'preinscriptions');
          if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/\s+/g, '_');
          cb(null, `${timestamp}_${sanitized}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        return cb(null, false);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiResponse({ status: 200, description: 'Commercial: upload pre-inscription picture.' })
  updateCommercialPicture(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    const companyId = req.user?.company_id;
    const actorId = req.user?.id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    if (!actorId) throw new BadRequestException('User id is required');
    if (!file) throw new BadRequestException('picture file is required');

    const relative = path.posix.join('uploads', 'preinscriptions', path.basename(file.path));
    const picturePath = `/${relative.replace(/\\/g, '/')}`;
    return this.preinscriptionsService.setPictureInPhase(id, companyId, actorId, 'commercial', picturePath);
  }

  @Patch(':id/picture/admin')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'preinscriptions');
          if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/\s+/g, '_');
          cb(null, `${timestamp}_${sanitized}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        return cb(null, false);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiResponse({ status: 200, description: 'Admin: upload pre-inscription picture.' })
  updateAdminPicture(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    const companyId = req.user?.company_id;
    const actorId = req.user?.id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    if (!actorId) throw new BadRequestException('User id is required');
    if (!file) throw new BadRequestException('picture file is required');

    const relative = path.posix.join('uploads', 'preinscriptions', path.basename(file.path));
    const picturePath = `/${relative.replace(/\\/g, '/')}`;
    return this.preinscriptionsService.setPictureInPhase(id, companyId, actorId, 'admin', picturePath);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Delete a pre-inscription.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preinscriptionsService.removeByCompany(+id, companyId);
  }

  /**
   * Sync a pre-inscription into the Student/User tables, like creating a new student.
   * Uses the authenticated user's company_id and StudentsService.create.
   */
  @Post(':id/sync-to-student')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 201,
    description:
      'Synchronize this pre-inscription into Student/User tables (creates a student and linked user).',
  })
  syncToStudent(@Request() req, @Param('id') id: string) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preinscriptionsService.syncToStudent(+id, companyId);
  }

  /**
   * Sync multiple pre-inscriptions into Student/User tables in one call.
   * For each ID, returns whether a student was created, skipped because already existing, or errored.
   */
  @Post('sync-to-students')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 201,
    description:
      'Synchronize multiple pre-inscriptions into Student/User tables (batch create).',
  })
  syncManyToStudents(
    @Request() req,
    @Body() body: SyncManyPreinscriptionsDto,
  ) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preinscriptionsService.syncManyToStudents(body.ids, companyId);
  }
}
