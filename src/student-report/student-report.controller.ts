import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentReportService } from './student-report.service';
import { CreateStudentReportDto } from './dto/create-student-report.dto';
import { UpdateStudentReportDto } from './dto/update-student-report.dto';
import { StudentReportQueryDto } from './dto/student-report-query.dto';
import { ReportDashboardQueryDto } from './dto/report-dashboard-query.dto';
import {
  CourseNotesAggregateBodyDto,
  CourseNotesAggregateQueryDto,
} from './dto/course-notes-aggregate-query.dto';
import {
  CourseNotesAggregateResponseDto,
} from './dto/course-notes-aggregate-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Student Reports')
@ApiExtraModels(CourseNotesAggregateResponseDto)
@ApiBearerAuth()
@Controller('student-reports')
export class StudentReportController {
  constructor(private readonly studentReportService: StudentReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Student report created successfully.' })
  create(@Request() req, @Body() dto: CreateStudentReportDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve student reports with pagination metadata.' })
  findAll(@Request() req, @Query() query: StudentReportQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportService.findAll(query, companyId);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve aggregated planning/report data for dashboards.' })
  getDashboard(@Request() req, @Query() query: ReportDashboardQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportService.getDashboard(query, companyId);
  }

  @Get('course-notes-aggregates')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    type: CourseNotesAggregateResponseDto,
    description:
      'Pre-aggregated course notes per student (grouped by student, course, teacher). Filters align with dashboard + optional student_ids, course_ids, teacher_ids (AND). Use query arrays as CSV or repeated params.',
  })
  getCourseNotesAggregates(@Request() req, @Query() query: CourseNotesAggregateQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportService.getCourseNotesAggregates(query, companyId);
  }

  @Post('course-notes-aggregates')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    type: CourseNotesAggregateResponseDto,
    description: 'Same as GET but accepts filters in JSON body (better for long id lists).',
  })
  postCourseNotesAggregates(@Request() req, @Body() body: CourseNotesAggregateBodyDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportService.getCourseNotesAggregates(body, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a student report by identifier.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a student report.' })
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentReportDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportService.update(id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a student report (sets status to -2).' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportService.remove(id, companyId);
  }
}
