import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentDiplomeService } from './student-diplome.service';
import { CreateStudentDiplomeDto } from './dto/create-student-diplome.dto';
import { UpdateStudentDiplomeDto } from './dto/update-student-diplome.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { StudentDiplomesQueryDto } from './dto/student-diplomes-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('StudentDiplome')
@ApiBearerAuth()
@Controller('student-diplome')
export class StudentDiplomeController {
  constructor(private readonly studentDiplomeService: StudentDiplomeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'StudentDiplome created successfully.' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'diplome_picture_1', maxCount: 1 },
      { name: 'diplome_picture_2', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'student-diplomes');
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
  create(@Request() req, @UploadedFiles() files: { diplome_picture_1?: Express.Multer.File[]; diplome_picture_2?: Express.Multer.File[]; }, @Body() createStudentDiplomeDto: CreateStudentDiplomeDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const f1 = files?.diplome_picture_1?.[0];
    const f2 = files?.diplome_picture_2?.[0];
    if (f1) {
      const relative = path.posix.join('uploads', 'student-diplomes', path.basename(f1.path));
      (createStudentDiplomeDto as any).diplome_picture_1 = `/${relative.replace(/\\/g, '/')}`;
    }
    if (f2) {
      const relative = path.posix.join('uploads', 'student-diplomes', path.basename(f2.path));
      (createStudentDiplomeDto as any).diplome_picture_2 = `/${relative.replace(/\\/g, '/')}`;
    }
    // sanitize text values possibly coming as [object Object]
    ['diplome_picture_1','diplome_picture_2'].forEach(k => {
      const v: any = (createStudentDiplomeDto as any)[k];
      if (v !== undefined && (typeof v !== 'string' || v === '[object Object]' || v === 'null' || v === 'undefined')) {
        delete (createStudentDiplomeDto as any)[k];
      }
    });
    return this.studentDiplomeService.create(createStudentDiplomeDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve student diplomas with pagination metadata.' })
  findAll(@Request() req, @Query() queryDto: StudentDiplomesQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentDiplomeService.findAll(queryDto, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a student diploma by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentDiplomeService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update a student diploma.' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'diplome_picture_1', maxCount: 1 },
      { name: 'diplome_picture_2', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'student-diplomes');
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
  update(
    @Request() req,
    @Param('id') id: string,
    @UploadedFiles() files: { diplome_picture_1?: Express.Multer.File[]; diplome_picture_2?: Express.Multer.File[]; },
    @Body() updateStudentDiplomeDto: UpdateStudentDiplomeDto,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const f1 = files?.diplome_picture_1?.[0];
    const f2 = files?.diplome_picture_2?.[0];
    if (f1) {
      const relative = path.posix.join('uploads', 'student-diplomes', path.basename(f1.path));
      (updateStudentDiplomeDto as any).diplome_picture_1 = `/${relative.replace(/\\/g, '/')}`;
    }
    if (f2) {
      const relative = path.posix.join('uploads', 'student-diplomes', path.basename(f2.path));
      (updateStudentDiplomeDto as any).diplome_picture_2 = `/${relative.replace(/\\/g, '/')}`;
    }
    ['diplome_picture_1','diplome_picture_2'].forEach(k => {
      const v: any = (updateStudentDiplomeDto as any)[k];
      if (v !== undefined && (typeof v !== 'string' || v === '[object Object]' || v === 'null' || v === 'undefined')) {
        delete (updateStudentDiplomeDto as any)[k];
      }
    });
    return this.studentDiplomeService.update(+id, updateStudentDiplomeDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a student diploma (sets status to -2).' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentDiplomeService.remove(+id, companyId);
  }
}
