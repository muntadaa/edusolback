import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { PagesService } from '../pages/pages.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleQueryDto } from './dto/role-query.dto';
import { AssignRolePageDto } from '../pages/dto/assign-role-page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly pagesService: PagesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Create a new role (Admin only)' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  create(@Request() req, @Body() createRoleDto: CreateRoleDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    // Only allow creating company-specific roles (not system roles via API)
    return this.rolesService.create({ ...createRoleDto, is_system: false }, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all roles for company with search and pagination (All authenticated users)' })
  @ApiResponse({ status: 200, description: 'Paginated list of roles' })
  findAll(@Request() req, @Query() queryDto: RoleQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.rolesService.findAll(queryDto, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Get a role by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role details' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.rolesService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Update a role (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.rolesService.update(id, updateRoleDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Delete a role (Admin only, cannot delete system roles)' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.rolesService.remove(id, companyId);
  }

  @Get(':id/pages')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Get all pages assigned to a role (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pages for the role' })
  getRolePages(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.pagesService.getPagesForRole(id, companyId);
  }

  @Post(':id/pages')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Assign a page to a role (Admin only)' })
  @ApiResponse({ status: 201, description: 'Page assigned to role successfully' })
  assignPageToRole(
    @Request() req,
    @Param('id', ParseIntPipe) roleId: number,
    @Body() assignDto: Omit<AssignRolePageDto, 'role_id'>,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.pagesService.assignToRole({ ...assignDto, role_id: roleId }, companyId);
  }

  @Delete(':id/pages/:pageId')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Remove a page assignment from a role (Admin only)' })
  @ApiResponse({ status: 200, description: 'Page assignment removed successfully' })
  removePageFromRole(
    @Request() req,
    @Param('id', ParseIntPipe) roleId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.pagesService.removeFromRole(roleId, pageId, companyId);
  }
}
