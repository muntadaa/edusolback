import { Controller, Get, Post, Delete, Param, UseGuards, Request, ParseIntPipe, BadRequestException, Body, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminOnlyGuard } from '../auth/guards/admin-only.guard';

@ApiTags('User Roles')
@ApiBearerAuth()
@Controller('users/:userId/roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all roles for a user (Admin or own user)' })
  @ApiResponse({ status: 200, description: 'List of user roles' })
  getUserRoles(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    
    // Allow users to view their own roles, or admins to view any user's roles
    const currentUserId = req.user.id;
    const isAdmin = req.user.userRoles?.some((ur: any) => ur.role?.code === 'admin') || false;
    
    if (userId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('You can only view your own roles, or you must be an administrator');
    }
    
    return this.userRolesService.getUserRoles(userId, companyId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Assign a role to a user (Admin only)' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  assignRole(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('role_id', ParseIntPipe) roleId: number,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.userRolesService.assignRole(userId, roleId, companyId);
  }

  @Delete(':roleId')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Remove a role from a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  removeRole(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.userRolesService.removeRole(userId, roleId, companyId);
  }
}
