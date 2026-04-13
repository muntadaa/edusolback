import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { ModuleService } from './module.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModuleQueryDto } from './dto/module-query.dto';
import { CourseAssignmentDto } from './dto/course-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Modules')
@ApiBearerAuth()
@Controller('module')
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Module created successfully.' })
  @UseInterceptors(
    FileInterceptor('pdf_file', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'modules');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${timestamp}_${sanitized}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        return cb(new BadRequestException('Only PDF files are allowed'), false);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  create(@Request() req, @UploadedFile() file: Express.Multer.File, @Body() createModuleDto: CreateModuleDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'modules', path.basename(file.path));
      createModuleDto.pdf_file = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (createModuleDto as any).pdf_file;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (createModuleDto as any).pdf_file;
      }
    }
    return this.moduleService.create(createModuleDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve modules with pagination metadata.' })
  findAll(@Request() req, @Query() queryDto: ModuleQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.moduleService.findAllWithPagination(queryDto, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a module by identifier.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.moduleService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update a module.' })
  @UseInterceptors(
    FileInterceptor('pdf_file', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'modules');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${timestamp}_${sanitized}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        return cb(new BadRequestException('Only PDF files are allowed'), false);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File, @Body() updateModuleDto: UpdateModuleDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'modules', path.basename(file.path));
      updateModuleDto.pdf_file = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (updateModuleDto as any).pdf_file;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (updateModuleDto as any).pdf_file;
      }
    }
    return this.moduleService.update(id, updateModuleDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a module.' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.moduleService.remove(id, companyId);
  }

  @Get(':id/courses')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve assigned and unassigned courses for a module.' })
  getModuleCourses(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.moduleService.getModuleCourses(id, companyId);
  }

  @Post(':id/courses')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Batch assign or unassign courses for a module.' })
  batchManageModuleCourses(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() assignmentDto: CourseAssignmentDto,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.moduleService.batchManageModuleCourses(id, assignmentDto, companyId);
  }

  @Post(':id/courses/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Attach a single course to a module.' })
  addCourseToModule(@Request() req, @Param('id', ParseIntPipe) id: number, @Param('courseId', ParseIntPipe) courseId: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.moduleService.addCourseToModule(id, courseId, companyId);
  }

  @Delete(':id/courses/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Detach a course from a module.' })
  removeCourseFromModule(@Request() req, @Param('id', ParseIntPipe) id: number, @Param('courseId', ParseIntPipe) courseId: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.moduleService.removeCourseFromModule(id, courseId, companyId);
  }
}

@ApiTags('Modules')
@ApiBearerAuth()
@Controller('modules')
export class ModuleCourseLookupController {
  constructor(private readonly moduleService: ModuleService) {}

  private ensureCompany(req: any): number {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return companyId;
  }

  @Get(':id/courses')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve the list of courses linked to a module.' })
  getLinkedCourses(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = this.ensureCompany(req);
    return this.moduleService.getLinkedCourses(id, companyId);
  }
}
