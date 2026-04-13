import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, UseGuards, Request, BadRequestException, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsQueryDto, StudentsWithoutReportQueryDto } from './dto/students-query.dto';
import { UnassignedForClassAssignmentQueryDto } from './dto/unassigned-for-class-assignment-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentSummaryResponseDto } from './dto/student-summary-response.dto';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Student profile created successfully.' })
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false, // Allow unknown properties for multipart/form-data
    transform: true,
    skipMissingProperties: false, // Don't skip missing properties - we need to validate required fields
  }))
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'students');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
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
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  create(@Request() req, @UploadedFile() file: any, @Body() createStudentDto: CreateStudentDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    
    // Clean and validate email field from multipart/form-data
    if ((createStudentDto as any).email) {
      const emailValue = (createStudentDto as any).email;
      if (typeof emailValue === 'string') {
        (createStudentDto as any).email = emailValue.trim();
      } else if (typeof emailValue !== 'string') {
        // Handle case where email might come as object or array from multipart
        (createStudentDto as any).email = String(emailValue).trim();
      }
    }
    
    if (file) {
      const relative = path.posix.join('uploads', 'students', path.basename(file.path));
      createStudentDto.picture = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (createStudentDto as any).picture;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (createStudentDto as any).picture;
      }
    }
    return this.studentsService.create(createStudentDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'List students with pagination metadata.' })
  findAll(@Request() req, @Query() query: StudentsQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.findAll(query, companyId);
  }

  @Get('without-report')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'List all students without any student report (for select dropdown). Supports filtering by school_year_id, school_year_period_id, and class_id.' })
  findAllWithoutReport(@Request() req, @Query() query: StudentsWithoutReportQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.findAllWithoutReport(query, companyId);
  }

  @Get('unassigned-for-class-assignment')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'Paginated students still assignable to the given class (same shape as GET /students). meta.total counts this filtered set only.',
  })
  @ApiResponse({ status: 404, description: 'Class not found for this company.' })
  findUnassignedForClassAssignment(@Request() req, @Query() query: UnassignedForClassAssignmentQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.findUnassignedForClassAssignment(query, companyId);
  }

  @Get(':id/with-class')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ 
    status: 200, 
    description: 'Retrieve a student with their active class information, including nested relations (specialization, level, schoolYear). Returns class: null if student has no active class.' 
  })
  findOneWithClass(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.findOneWithClass(+id, companyId);
  }

  @Get(':id/with-academic')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'Retrieve a student with academic context (program/specialization/level/schoolYear) derived from class_students. Academic can be null if no class_students row exists.',
  })
  findOneWithAcademic(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.findOneWithAcademic(+id, companyId);
  }

  @Get(':id/summary')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: StudentSummaryResponseDto })
  @ApiResponse({
    status: 200,
    description:
      'Student identity plus classe, specialization, level, and school year (YearGraduation) from the latest class_students assignment; uses class relations when class_id is set, otherwise denormalized class_students relations.',
  })
  findOneSummary(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.findOneSummary(+id, companyId);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ 
    status: 200, 
    description: 'Retrieve a student with all related data: diplomas, contacts, and link types.' 
  })
  findOneWithDetails(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.findOneWithDetails(+id, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a single student profile.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update a student profile.' })
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'students');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
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
  update(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', 'students', path.basename(file.path));
      updateStudentDto.picture = `/${relative.replace(/\\/g, '/')}`;
    } else if ((updateStudentDto as any).picture !== undefined) {
      const val: any = (updateStudentDto as any).picture;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (updateStudentDto as any).picture;
      }
    }
    return this.studentsService.update(+id, updateStudentDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a student and all related resources using transaction (sets status to -2).' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.remove(+id, companyId);
  }

  @Post(':id/send-password-invitation')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Send password invitation email to student. This endpoint is triggered by frontend button.' })
  sendPasswordInvitation(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsService.sendPasswordInvitation(+id, companyId);
  }
}
