import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeachersQueryDto } from './dto/teachers-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShareTeacherResourceDto } from './dto/share-teacher-resource.dto';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Teacher created successfully.' })
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'teachers');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
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
  create(@Request() req, @UploadedFile() file, @Body() createTeacherDto: CreateTeacherDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', 'teachers', path.basename(file.path));
      createTeacherDto.picture = `/${relative.replace(/\\/g, '/')}`;
    } else {
      const val: any = (createTeacherDto as any).picture;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (createTeacherDto as any).picture;
      }
    }
    return this.teachersService.create(createTeacherDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve teachers with pagination metadata.' })
  findAll(@Request() req, @Query() query: TeachersQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.teachersService.findAll(query, companyId);
  }

  @Post('share-resource')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Resource emailed to one or more students (see count in body).' })
  @ApiResponse({ status: 400, description: 'Validation error or missing link and file.' })
  @ApiResponse({ status: 403, description: 'Not a teacher/admin or not allowed to contact this student.' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  shareResource(
    @Request() req,
    @Body() body: ShareTeacherResourceDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.teachersService.shareResourceWithStudent(body, file, req.user, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a teacher by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.teachersService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update an existing teacher.' })
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'teachers');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
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
    @UploadedFile() file,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (file) {
      const relative = path.posix.join('uploads', 'teachers', path.basename(file.path));
      updateTeacherDto.picture = `/${relative.replace(/\\/g, '/')}`;
    } else if ((updateTeacherDto as any).picture !== undefined) {
      const val: any = (updateTeacherDto as any).picture;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (updateTeacherDto as any).picture;
      }
    }
    return this.teachersService.update(+id, updateTeacherDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a teacher record.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.teachersService.remove(+id, companyId);
  }

  @Post(':id/send-password-invitation')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Send password invitation email to teacher. This endpoint is triggered by frontend button.' })
  sendPasswordInvitation(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.teachersService.sendPasswordInvitation(+id, companyId);
  }
}
