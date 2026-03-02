import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { LevelService } from './level.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { LevelQueryDto } from './dto/level-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Levels')
@ApiBearerAuth()
@Controller('levels')
export class LevelController {
  constructor(private readonly service: LevelService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Level created successfully.' })
  @UseInterceptors(
    FileInterceptor('pdf_file', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'levels');
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
  create(@Request() req, @UploadedFile() file: Express.Multer.File, @Body() dto: CreateLevelDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'levels', path.basename(file.path));
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
  @ApiResponse({ status: 200, description: 'Retrieve levels with pagination metadata.' })
  findAll(@Request() req, @Query() query: LevelQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a level by identifier.' })
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
  @ApiResponse({ status: 200, description: 'Update a level.' })
  @UseInterceptors(
    FileInterceptor('pdf_file', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'levels');
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
  update(@Request() req, @Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() dto: UpdateLevelDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'levels', path.basename(file.path));
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
  @ApiResponse({ status: 200, description: 'Remove a level.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.remove(+id, companyId);
  }
}
