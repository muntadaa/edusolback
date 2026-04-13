import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { SpecializationsService } from './specializations.service';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { SpecializationQueryDto } from './dto/specialization-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Specializations')
@ApiBearerAuth()
@Controller('specializations')
export class SpecializationsController {
  constructor(private readonly specializationsService: SpecializationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Specialization created successfully.' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'pdf_file', maxCount: 1 },
      { name: 'accreditationDocument', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'specializations');
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
  create(
    @Request() req,
    @UploadedFiles()
    files: { pdf_file?: Express.Multer.File[]; accreditationDocument?: Express.Multer.File[] },
    @Body() createSpecializationDto: CreateSpecializationDto,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const pdfFile = files?.pdf_file?.[0];
    const accredFile = files?.accreditationDocument?.[0];

    if (pdfFile) {
      const relative = path.posix.join('uploads', `${companyId}`, 'specializations', path.basename(pdfFile.path));
      createSpecializationDto.pdf_file = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (createSpecializationDto as any).pdf_file;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (createSpecializationDto as any).pdf_file;
      }
    }

    if (accredFile) {
      const relative = path.posix.join('uploads', `${companyId}`, 'specializations', path.basename(accredFile.path));
      (createSpecializationDto as any).accreditationDocument = `/${relative.replace(/\\/g, '/')}`;
    }

    return this.specializationsService.create(createSpecializationDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve specializations with pagination metadata.' })
  findAll(@Request() req, @Query() query: SpecializationQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.specializationsService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a specialization by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.specializationsService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update a specialization.' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'pdf_file', maxCount: 1 },
      { name: 'accreditationDocument', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'specializations');
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
  update(
    @Request() req,
    @Param('id') id: string,
    @UploadedFiles()
    files: { pdf_file?: Express.Multer.File[]; accreditationDocument?: Express.Multer.File[] },
    @Body() updateSpecializationDto: UpdateSpecializationDto,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const pdfFile = files?.pdf_file?.[0];
    const accredFile = files?.accreditationDocument?.[0];

    if (pdfFile) {
      const relative = path.posix.join('uploads', `${companyId}`, 'specializations', path.basename(pdfFile.path));
      updateSpecializationDto.pdf_file = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (updateSpecializationDto as any).pdf_file;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (updateSpecializationDto as any).pdf_file;
      }
    }

    if (accredFile) {
      const relative = path.posix.join('uploads', `${companyId}`, 'specializations', path.basename(accredFile.path));
      (updateSpecializationDto as any).accreditationDocument = `/${relative.replace(/\\/g, '/')}`;
    }

    return this.specializationsService.update(+id, updateSpecializationDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a specialization.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.specializationsService.remove(+id, companyId);
  }
}
