import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RouteAccessGuard } from '../auth/guards/route-access.guard';
import { RequirePageRoute } from '../common/decorators/require-page-route.decorator';
import { AuditorDocumentsService } from './auditor-documents.service';
import { AuditorDocumentsQueryDto } from './dto/auditor-documents-query.dto';
import { SyncAuditorDocumentsDto } from './dto/sync-auditor-documents.dto';

/**
 * Same page route as required-docs settings: anyone with Page access to this path
 * may list/sync/upload/verify — no separate "auditor" role required.
 */
const SETTINGS_REQUIRED_DOCS_PAGE =
  process.env.REQUIRED_DOCS_SETTINGS_PAGE_ROUTE?.trim() || '/settings/required-documents';

@ApiTags('Auditor')
@ApiBearerAuth()
@Controller('auditor')
export class AuditorDocumentsController {
  constructor(private readonly auditorDocumentsService: AuditorDocumentsService) {}

  @Get('documents')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(SETTINGS_REQUIRED_DOCS_PAGE)
  list(@Request() req, @Query() q: AuditorDocumentsQueryDto) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.auditorDocumentsService.findAllForStudent(companyId, q);
  }

  @Post('documents/sync')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(SETTINGS_REQUIRED_DOCS_PAGE)
  sync(@Request() req, @Body() dto: SyncAuditorDocumentsDto) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.auditorDocumentsService.manualSync(companyId, dto);
  }

  @Get('documents/:id')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(SETTINGS_REQUIRED_DOCS_PAGE)
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.auditorDocumentsService.findOne(id, companyId);
  }

  @Patch('documents/:id/verify')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(SETTINGS_REQUIRED_DOCS_PAGE)
  verify(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user?.company_id;
    const userId = req.user?.id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    if (!userId) throw new BadRequestException('User id is required');
    return this.auditorDocumentsService.verify(id, companyId, userId);
  }

  @Patch('documents/:id/unverify')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(SETTINGS_REQUIRED_DOCS_PAGE)
  unverify(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.auditorDocumentsService.unverify(id, companyId);
  }

  @Post('documents/:id/upload')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(SETTINGS_REQUIRED_DOCS_PAGE)
  @ApiConsumes('multipart/form-data')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const companyId = (req as any).user?.company_id;
          const base = path.join(process.cwd(), 'uploads', 'auditor', String(companyId ?? '0'));
          if (!fs.existsSync(base)) {
            fs.mkdirSync(base, { recursive: true });
          }
          cb(null, base);
        },
        filename: (_req, file, cb) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/\s+/g, '_');
          cb(null, `${timestamp}_${sanitized}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new BadRequestException('Only PDF and images are allowed'), false);
      },
    }),
  )
  async upload(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.path) {
      throw new BadRequestException('file is required');
    }
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const publicPath = this.auditorDocumentsService.buildPublicFilePath(
      companyId,
      path.basename(file.path),
    );
    return this.auditorDocumentsService.attachFile(id, companyId, publicPath);
  }
}
