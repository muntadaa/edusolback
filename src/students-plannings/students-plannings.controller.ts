import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentsPlanningsService } from './students-plannings.service';
import { CreateStudentsPlanningDto } from './dto/create-students-planning.dto';
import { UpdateStudentsPlanningDto } from './dto/update-students-planning.dto';
import { StudentsPlanningQueryDto } from './dto/students-planning-query.dto';
import { DuplicatePlanningDto } from './dto/duplicate-planning.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Planning Students')
@ApiBearerAuth()
@Controller('students-plannings')
export class StudentsPlanningsController {
  constructor(private readonly studentsPlanningsService: StudentsPlanningsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Planning entry created successfully.' })
  create(@Request() req, @Body() createStudentsPlanningDto: CreateStudentsPlanningDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.create(createStudentsPlanningDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve planning entries with pagination metadata.' })
  findAll(@Request() req, @Query() query: StudentsPlanningQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.findAll(query, companyId);
  }

  @Get('presence')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Retrieve planning entries for presence, only from past dates up to today.',
  })
  findForPresence(@Request() req, @Query() query: StudentsPlanningQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.findForPresence(query, companyId);
  }

  @Post(':id/notes/validate')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Validate and lock all notes for this session. Only allowed when hasNotes === true.' })
  validateNotes(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.validateNotes(id, companyId);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Activate session: lock presence and set session status to ACTIVATED. Does not check notes.' })
  activateSession(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.activateSession(id, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve planning entry by identifier.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update planning entry.' })
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() updateStudentsPlanningDto: UpdateStudentsPlanningDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.update(id, updateStudentsPlanningDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Delete planning entry.' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.remove(id, companyId);
  }

  @Post('duplicate')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Duplicate planning based on type (week, frequency, or recurring). Returns created plannings.' })
  duplicate(@Request() req, @Body() duplicatePlanningDto: DuplicatePlanningDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentsPlanningsService.duplicatePlanning(duplicatePlanningDto, companyId);
  }
}
