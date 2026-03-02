import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramQueryDto } from './dto/program-query.dto';
import { ProgramService } from './programs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Programs')
@ApiBearerAuth()
@Controller('programs')
export class ProgramController {
  constructor(private readonly service: ProgramService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Program created successfully.' })
  @UseInterceptors(
    FileInterceptor('pdf_file', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'programs');
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
  create(@Request() req, @UploadedFile() file: Express.Multer.File, @Body() dto: CreateProgramDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'programs', path.basename(file.path));
      dto.pdf_file = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (dto as any).pdf_file;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (dto as any).pdf_file;
      }
    }
    return this.service.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve programs with pagination metadata.' })
  findAll(@Request() req, @Query() query: ProgramQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a program by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update a program.' })
  @UseInterceptors(
    FileInterceptor('pdf_file', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'programs');
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
  update(@Request() req, @Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() dto: UpdateProgramDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'programs', path.basename(file.path));
      dto.pdf_file = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (dto as any).pdf_file;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (dto as any).pdf_file;
      }
    }
    return this.service.update(+id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a program.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.remove(+id, companyId);
  }
}
