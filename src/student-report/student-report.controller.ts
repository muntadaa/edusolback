import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentReportService } from './student-report.service';
import { CreateStudentReportDto } from './dto/create-student-report.dto';
import { UpdateStudentReportDto } from './dto/update-student-report.dto';
import { StudentReportQueryDto } from './dto/student-report-query.dto';
import { ReportDashboardQueryDto } from './dto/report-dashboard-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Student Reports')
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
