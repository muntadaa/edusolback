import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TeacherCourseService } from './teacher-course.service';
import { CreateTeacherCourseDto } from './dto/create-teacher-course.dto';
import { UpdateTeacherCourseDto } from './dto/update-teacher-course.dto';
import { TeacherCourseQueryDto } from './dto/teacher-course-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Teacher Course')
@ApiBearerAuth()
@Controller('teacher-course')
export class TeacherCourseController {
  constructor(private readonly teacherCourseService: TeacherCourseService) {}

  private ensureCompany(req: any): number {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return companyId;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assign a teacher to a course', description: 'Creates a new teacher-course assignment. If a deleted assignment exists, it will be restored.' })
  @ApiResponse({ status: 201, description: 'Teacher assigned to course successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request - Teacher already assigned to this course or validation error.' })
  @ApiResponse({ status: 404, description: 'Teacher or course not found.' })
  create(@Request() req, @Body() createTeacherCourseDto: CreateTeacherCourseDto) {
    const companyId = this.ensureCompany(req);
    return this.teacherCourseService.create(createTeacherCourseDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all teacher-course assignments', description: 'Retrieves paginated list of teacher-course assignments with optional filtering.' })
  @ApiResponse({ status: 200, description: 'List teacher-course relations with pagination.' })
  findAll(@Request() req, @Query() query: TeacherCourseQueryDto) {
    const companyId = this.ensureCompany(req);
    return this.teacherCourseService.findAll(query, companyId);
  }

  @Get('course/:course_id/teachers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get all teachers assigned to a course', 
    description: 'Returns a list of all teachers assigned to the specified course. Only returns active assignments and active teachers.' 
  })
  @ApiParam({ name: 'course_id', description: 'Course identifier', example: 16 })
  @ApiResponse({ status: 200, description: 'List of teachers assigned to the course.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  getTeachersByCourse(@Request() req, @Param('course_id', ParseIntPipe) courseId: number) {
    const companyId = this.ensureCompany(req);
    return this.teacherCourseService.getTeachersByCourse(courseId, companyId);
  }

  @Get(':teacher_id/:course_id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific teacher-course assignment', description: 'Retrieves a single teacher-course assignment by teacher ID and course ID.' })
  @ApiParam({ name: 'teacher_id', description: 'Teacher identifier', example: 5 })
  @ApiParam({ name: 'course_id', description: 'Course identifier', example: 16 })
  @ApiResponse({ status: 200, description: 'Teacher-course relation retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Teacher-course relation not found.' })
  findOne(
    @Request() req,
    @Param('teacher_id', ParseIntPipe) teacherId: number,
    @Param('course_id', ParseIntPipe) courseId: number,
  ) {
    const companyId = this.ensureCompany(req);
    return this.teacherCourseService.findOne(teacherId, courseId, companyId);
  }

  @Patch(':teacher_id/:course_id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a teacher-course assignment', description: 'Updates the properties of an existing teacher-course assignment (tri, volume, coefficient, status).' })
  @ApiParam({ name: 'teacher_id', description: 'Teacher identifier', example: 5 })
  @ApiParam({ name: 'course_id', description: 'Course identifier', example: 16 })
  @ApiResponse({ status: 200, description: 'Teacher-course relation updated successfully.' })
  @ApiResponse({ status: 404, description: 'Teacher-course relation not found.' })
  update(
    @Request() req,
    @Param('teacher_id', ParseIntPipe) teacherId: number,
    @Param('course_id', ParseIntPipe) courseId: number,
    @Body() updateTeacherCourseDto: UpdateTeacherCourseDto,
  ) {
    const companyId = this.ensureCompany(req);
    return this.teacherCourseService.update(teacherId, courseId, updateTeacherCourseDto, companyId);
  }

  @Delete(':teacher_id/:course_id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a teacher-course assignment', description: 'Soft deletes a teacher-course assignment by setting status to -2.' })
  @ApiParam({ name: 'teacher_id', description: 'Teacher identifier', example: 5 })
  @ApiParam({ name: 'course_id', description: 'Course identifier', example: 16 })
  @ApiResponse({ status: 200, description: 'Teacher-course relation removed successfully.' })
  @ApiResponse({ status: 404, description: 'Teacher-course relation not found.' })
  remove(
    @Request() req,
    @Param('teacher_id', ParseIntPipe) teacherId: number,
    @Param('course_id', ParseIntPipe) courseId: number,
  ) {
    const companyId = this.ensureCompany(req);
    return this.teacherCourseService.remove(teacherId, courseId, companyId);
  }
}
