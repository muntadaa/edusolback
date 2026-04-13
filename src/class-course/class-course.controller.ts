import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassCourseService } from './class-course.service';
import { CreateClassCourseDto } from './dto/create-class-course.dto';
import { UpdateClassCourseDto } from './dto/update-class-course.dto';
import { ClassCourseQueryDto } from './dto/class-course-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateClassCourseBatchDto } from './dto/create-class-course-batch.dto';

@ApiTags('Class Courses')
@ApiBearerAuth()
@Controller('class-course')
export class ClassCourseController {
  constructor(private readonly classCourseService: ClassCourseService) {}

  private ensureCompany(req: any): number {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return companyId;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Class course affected successfully.' })
  create(@Request() req, @Body() dto: CreateClassCourseDto) {
    const companyId = this.ensureCompany(req);
    return this.classCourseService.create(dto, companyId);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Multiple class courses affected successfully.' })
  createBatch(@Request() req, @Body() dto: CreateClassCourseBatchDto) {
    const companyId = this.ensureCompany(req);
    return this.classCourseService.createMany(dto.items, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve class courses with pagination metadata.' })
  findAll(@Request() req, @Query() query: ClassCourseQueryDto) {
    const companyId = this.ensureCompany(req);
    return this.classCourseService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a class course by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = this.ensureCompany(req);
    return this.classCourseService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a class course.' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateClassCourseDto) {
    const companyId = this.ensureCompany(req);
    return this.classCourseService.update(+id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a class course.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = this.ensureCompany(req);
    return this.classCourseService.remove(+id, companyId);
  }
}
