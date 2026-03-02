import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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
    FileInterceptor('pdf_file', {
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
  create(@Request() req, @UploadedFile() file: Express.Multer.File, @Body() createSpecializationDto: CreateSpecializationDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'specializations', path.basename(file.path));
      createSpecializationDto.pdf_file = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (createSpecializationDto as any).pdf_file;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (createSpecializationDto as any).pdf_file;
      }
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
    FileInterceptor('pdf_file', {
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
  update(@Request() req, @Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() updateSpecializationDto: UpdateSpecializationDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'specializations', path.basename(file.path));
      updateSpecializationDto.pdf_file = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (updateSpecializationDto as any).pdf_file;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (updateSpecializationDto as any).pdf_file;
      }
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
