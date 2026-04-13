import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModuleCourseService } from './module-course.service';
import { CreateModuleCourseDto } from './dto/create-module-course.dto';
import { UpdateModuleCourseDto } from './dto/update-module-course.dto';
import { ModuleCourseQueryDto } from './dto/module-course-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Module Course')
@ApiBearerAuth()
@Controller('module-course')
export class ModuleCourseController {
  constructor(private readonly moduleCourseService: ModuleCourseService) {}

  private ensureCompany(req: any): number {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return companyId;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Module linked to course successfully.' })
  create(@Request() req, @Body() createModuleCourseDto: CreateModuleCourseDto) {
    const companyId = this.ensureCompany(req);
    return this.moduleCourseService.create(createModuleCourseDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'List module-course relations with pagination.' })
  findAll(@Request() req, @Query() query: ModuleCourseQueryDto) {
    const companyId = this.ensureCompany(req);
    return this.moduleCourseService.findAll(query, companyId);
  }

  @Get(':module_id/:course_id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Fetch specific module-course relation.' })
  findOne(
    @Request() req,
    @Param('module_id', ParseIntPipe) moduleId: number,
    @Param('course_id', ParseIntPipe) courseId: number,
  ) {
    const companyId = this.ensureCompany(req);
    return this.moduleCourseService.findOne(moduleId, courseId, companyId);
  }

  @Patch(':module_id/:course_id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update module-course relation.' })
  update(
    @Request() req,
    @Param('module_id', ParseIntPipe) moduleId: number,
    @Param('course_id', ParseIntPipe) courseId: number,
    @Body() updateModuleCourseDto: UpdateModuleCourseDto,
  ) {
    const companyId = this.ensureCompany(req);
    return this.moduleCourseService.update(moduleId, courseId, updateModuleCourseDto, companyId);
  }

  @Delete(':module_id/:course_id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove module-course relation.' })
  remove(
    @Request() req,
    @Param('module_id', ParseIntPipe) moduleId: number,
    @Param('course_id', ParseIntPipe) courseId: number,
  ) {
    const companyId = this.ensureCompany(req);
    return this.moduleCourseService.remove(moduleId, courseId, companyId);
  }
}
