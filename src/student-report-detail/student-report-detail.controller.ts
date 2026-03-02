import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentReportDetailService } from './student-report-detail.service';
import { CreateStudentReportDetailDto } from './dto/create-student-report-detail.dto';
import { UpdateStudentReportDetailDto } from './dto/update-student-report-detail.dto';
import { StudentReportDetailQueryDto } from './dto/student-report-detail-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Student Report Details')
@ApiBearerAuth()
@Controller('student-report-details')
export class StudentReportDetailController {
  constructor(private readonly studentReportDetailService: StudentReportDetailService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Student report detail created successfully.' })
  create(@Request() req, @Body() dto: CreateStudentReportDetailDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportDetailService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve student report details with pagination metadata.' })
  findAll(@Request() req, @Query() query: StudentReportDetailQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportDetailService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a student report detail by identifier.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportDetailService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a student report detail.' })
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentReportDetailDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportDetailService.update(id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a student report detail (sets status to -2).' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentReportDetailService.remove(id, companyId);
  }
}
