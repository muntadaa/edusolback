import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequiredDocsService } from './required-docs.service';
import { CreateRequiredDocDto } from './dto/create-required-doc.dto';
import { UpdateRequiredDocDto } from './dto/update-required-doc.dto';
import { RequiredDocsQueryDto } from './dto/required-docs-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RouteAccessGuard } from '../auth/guards/route-access.guard';
import { RequirePageRoute } from '../common/decorators/require-page-route.decorator';

const REQUIRED_DOCS_PAGE =
  process.env.REQUIRED_DOCS_SETTINGS_PAGE_ROUTE?.trim() || '/settings/required-documents';

@ApiTags('Required documents')
@ApiBearerAuth()
@Controller('required-docs')
export class RequiredDocsController {
  constructor(private readonly requiredDocsService: RequiredDocsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(REQUIRED_DOCS_PAGE)
  create(@Request() req, @Body() dto: CreateRequiredDocDto) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.requiredDocsService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(REQUIRED_DOCS_PAGE)
  findAll(@Request() req, @Query() q: RequiredDocsQueryDto) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.requiredDocsService.findAll(companyId, q);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(REQUIRED_DOCS_PAGE)
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.requiredDocsService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(REQUIRED_DOCS_PAGE)
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequiredDocDto,
  ) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.requiredDocsService.update(id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RouteAccessGuard)
  @RequirePageRoute(REQUIRED_DOCS_PAGE)
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    return this.requiredDocsService.remove(id, companyId);
  }
}
