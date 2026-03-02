import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { AssignRolePageDto } from './dto/assign-role-page.dto';
import { CreatePagesFromRoutesDto } from './dto/create-pages-from-routes.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';

@ApiTags('Pages')
@ApiBearerAuth()
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Create a new global page (Admin only - pages are global for all companies)' })
  @ApiResponse({ status: 201, description: 'Page created successfully' })
  create(@Body() createPageDto: CreatePageDto) {
    return this.pagesService.create(createPageDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Get all global pages with search and pagination (Admin only - pages are global)' })
  @ApiResponse({ status: 200, description: 'Paginated list of all global pages' })
  findAll(@Query() queryDto: PageQueryDto) {
    return this.pagesService.findAll(queryDto);
  }

  @Get('my-routes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get allowed routes for current user' })
  @ApiResponse({ status: 200, description: 'List of allowed routes for the current user' })
  async getMyRoutes(@Request() req) {
    const user = req.user;
    const roleIds = user.userRoles?.map((ur: any) => ur.role?.id).filter(Boolean) || [];
    const companyId = user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const routes = await this.pagesService.getAllowedRoutes(roleIds, companyId);
    return { routes };
  }

  @Post('create-from-routes')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Create multiple global pages from routes array (Admin only - pages are global)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Pages created successfully. Returns count of created, skipped, and any errors.' 
  })
  createPagesFromRoutes(@Body() createPagesDto: CreatePagesFromRoutesDto) {
    return this.pagesService.createPagesFromRoutes(createPagesDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Get a global page by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Page details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Update a global page (Admin only)' })
  @ApiResponse({ status: 200, description: 'Page updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePageDto: UpdatePageDto) {
    return this.pagesService.update(id, updatePageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Delete a global page (Admin only)' })
  @ApiResponse({ status: 200, description: 'Page deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.remove(id);
  }

  @Post('assign')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Assign a page to a role (Admin only)' })
  @ApiResponse({ status: 201, description: 'Page assigned to role successfully' })
  assignToRole(@Request() req, @Body() assignDto: AssignRolePageDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.pagesService.assignToRole(assignDto, companyId);
  }

  @Delete('assign/:roleId/:pageId')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Remove a page assignment from a role (Admin only)' })
  @ApiResponse({ status: 200, description: 'Page assignment removed successfully' })
  removeFromRole(
    @Request() req,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.pagesService.removeFromRole(roleId, pageId, companyId);
  }

  @Get('role/:roleId')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Get all pages assigned to a role (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pages for the role' })
  getPagesForRole(@Request() req, @Param('roleId', ParseIntPipe) roleId: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.pagesService.getPagesForRole(roleId, companyId);
  }

  @Get('page/:pageId/roles')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Get all roles that have access to a page (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of roles for the page' })
  getRolesForPage(@Request() req, @Param('pageId', ParseIntPipe) pageId: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.pagesService.getRolesForPage(pageId, companyId);
  }
}

