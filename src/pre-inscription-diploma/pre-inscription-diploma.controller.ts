import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { PreInscriptionDiplomaService } from './pre-inscription-diploma.service';
import { CreatePreInscriptionDiplomaDto } from './dto/create-pre-inscription-diploma.dto';
import { UpdatePreInscriptionDiplomaDto } from './dto/update-pre-inscription-diploma.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('PreInscriptionDiploma')
@ApiBearerAuth()
@Controller('pre-inscription-diploma')
export class PreInscriptionDiplomaController {
  constructor(private readonly preInscriptionDiplomaService: PreInscriptionDiplomaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'PreInscriptionDiploma created successfully.' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'diplome_picture_1', maxCount: 1 },
        { name: 'diplome_picture_2', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = path.join(process.cwd(), 'uploads', 'pre-inscription-diplomas');
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
      },
    ),
  )
  create(
    @Request() req,
    @UploadedFiles()
    files: { diplome_picture_1?: Express.Multer.File[]; diplome_picture_2?: Express.Multer.File[] },
    @Body() dto: CreatePreInscriptionDiplomaDto,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const f1 = files?.diplome_picture_1?.[0];
    const f2 = files?.diplome_picture_2?.[0];
    if (f1) {
      const relative = path.posix.join(
        'uploads',
        'pre-inscription-diplomas',
        path.basename(f1.path),
      );
      (dto as any).diplome_picture_1 = `/${relative.replace(/\\/g, '/')}`;
    }
    if (f2) {
      const relative = path.posix.join(
        'uploads',
        'pre-inscription-diplomas',
        path.basename(f2.path),
      );
      (dto as any).diplome_picture_2 = `/${relative.replace(/\\/g, '/')}`;
    }
    ['diplome_picture_1', 'diplome_picture_2'].forEach((k) => {
      const v: any = (dto as any)[k];
      if (
        v !== undefined &&
        (typeof v !== 'string' || v === '[object Object]' || v === 'null' || v === 'undefined')
      ) {
        delete (dto as any)[k];
      }
    });
    return this.preInscriptionDiplomaService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve pre-inscription diplomas.' })
  findAll(@Request() req, @Query('preinscription_id') preinscriptionId?: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const preId = preinscriptionId ? Number(preinscriptionId) : undefined;
    return this.preInscriptionDiplomaService.findAll(companyId, preId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a pre-inscription diploma by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preInscriptionDiplomaService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update a pre-inscription diploma.' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'diplome_picture_1', maxCount: 1 },
        { name: 'diplome_picture_2', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = path.join(process.cwd(), 'uploads', 'pre-inscription-diplomas');
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
      },
    ),
  )
  update(
    @Request() req,
    @Param('id') id: string,
    @UploadedFiles()
    files: { diplome_picture_1?: Express.Multer.File[]; diplome_picture_2?: Express.Multer.File[] },
    @Body() dto: UpdatePreInscriptionDiplomaDto,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const f1 = files?.diplome_picture_1?.[0];
    const f2 = files?.diplome_picture_2?.[0];
    if (f1) {
      const relative = path.posix.join(
        'uploads',
        'pre-inscription-diplomas',
        path.basename(f1.path),
      );
      (dto as any).diplome_picture_1 = `/${relative.replace(/\\/g, '/')}`;
    }
    if (f2) {
      const relative = path.posix.join(
        'uploads',
        'pre-inscription-diplomas',
        path.basename(f2.path),
      );
      (dto as any).diplome_picture_2 = `/${relative.replace(/\\/g, '/')}`;
    }
    ['diplome_picture_1', 'diplome_picture_2'].forEach((k) => {
      const v: any = (dto as any)[k];
      if (
        v !== undefined &&
        (typeof v !== 'string' || v === '[object Object]' || v === 'null' || v === 'undefined')
      ) {
        delete (dto as any)[k];
      }
    });
    return this.preInscriptionDiplomaService.update(+id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a pre-inscription diploma (sets status to -2).' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.preInscriptionDiplomaService.remove(+id, companyId);
  }
}
