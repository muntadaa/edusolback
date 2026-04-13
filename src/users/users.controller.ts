import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { SendPasswordInvitationDto } from './dto/send-password-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private ensureCompany(req: any): number {
    const companyId = req.user?.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return companyId;
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully. If password was not provided, a password setup email will be automatically sent to the user. The user will be created with status 2 (pending) and will become active (status 1) after setting their password. Roles are optional - users can be created without roles and roles can be assigned later. Supports picture file upload (JPEG, PNG, GIF, WebP, max 2MB).' 
  })
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'users');
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
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  create(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
  ) {
    const companyId = this.ensureCompany(req);
    
    // Handle file upload
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'users', path.basename(file.path));
      (createUserDto as any).picture = `/${relative.replace(/\\/g, '/')}`;
    }
    
    return this.usersService.create(createUserDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Retrieve users with pagination metadata.' })
  findAll(@Request() req, @Query() queryDto: UsersQueryDto) {
    const companyId = this.ensureCompany(req);
    return this.usersService.findAllWithPagination(queryDto, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Retrieve a user by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = this.ensureCompany(req);
    return this.usersService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update a user profile. Supports picture file upload (JPEG, PNG, GIF, WebP, max 2MB).' })
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.user?.company_id;
          if (!companyId) {
            return cb(new Error('User must belong to a company'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'users');
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
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  update(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const companyId = this.ensureCompany(req);
    
    // Handle file upload
    if (file) {
      const relative = path.posix.join('uploads', `${companyId}`, 'users', path.basename(file.path));
      updateUserDto.picture = `/${relative.replace(/\\/g, '/')}`;
    } else if ((updateUserDto as any).picture !== undefined) {
      // If picture field is provided but not a file, validate it's a string
      const val: any = (updateUserDto as any).picture;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete (updateUserDto as any).picture;
      }
    }
    
    return this.usersService.update(+id, updateUserDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Remove a user.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = this.ensureCompany(req);
    return this.usersService.remove(+id, companyId);
  }

  @Post(':id/send-password-invitation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Send password invitation email to user by ID. This regenerates the token and sends a new email.' })
  sendPasswordInvitationById(@Request() req, @Param('id') id: string) {
    const companyId = this.ensureCompany(req);
    return this.usersService.sendPasswordInvitationById(+id, companyId);
  }

  @Post('send-password-invitation-by-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Send password invitation email to user by email address. This regenerates the token and sends a new email.' })
  sendPasswordInvitationByEmail(@Request() req, @Body() sendPasswordInvitationDto: SendPasswordInvitationDto) {
    const companyId = this.ensureCompany(req);
    return this.usersService.sendPasswordInvitationByEmail(sendPasswordInvitationDto.email, companyId);
  }
}
