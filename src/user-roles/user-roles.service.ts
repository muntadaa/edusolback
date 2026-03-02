import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UserRolesService {
  private readonly logger = new Logger(UserRolesService.name);

  constructor(
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: number, companyId: number): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { user_id: userId, company_id: companyId },
      relations: ['role'],
    });

    return userRoles.map(ur => ur.role);
  }

  /**
   * Assign a role to a user
   */
  async assignRole(userId: number, roleId: number, companyId: number): Promise<UserRole> {
    // Verify user exists and belongs to company
    const user = await this.userRepository.findOne({
      where: { id: userId, company_id: companyId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify role exists and is accessible (system role or company role)
    const role = await this.roleRepository.findOne({
      where: [
        { id: roleId, company_id: IsNull() }, // System role
        { id: roleId, company_id: companyId }, // Company role
      ],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found or not accessible`);
    }

    // Check if assignment already exists
    const existing = await this.userRoleRepository.findOne({
      where: {
        user_id: userId,
        role_id: roleId,
        company_id: companyId,
      },
    });

    if (existing) {
      throw new BadRequestException(`User ${userId} already has role ${roleId}`);
    }

    const userRole = this.userRoleRepository.create({
      user_id: userId,
      role_id: roleId,
      company_id: companyId,
    });

    return await this.userRoleRepository.save(userRole);
  }

  /**
   * Remove a role from a user
   */
  async removeRole(userId: number, roleId: number, companyId: number): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: {
        user_id: userId,
        role_id: roleId,
        company_id: companyId,
      },
    });

    if (!userRole) {
      throw new NotFoundException(`User ${userId} does not have role ${roleId}`);
    }

    await this.userRoleRepository.remove(userRole);
  }

  /**
   * Bulk assign roles to a user
   */
  async bulkAssignRoles(userId: number, roleIds: number[], companyId: number): Promise<void> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId, company_id: companyId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify all roles exist and are accessible
    const roles = await this.roleRepository.find({
      where: [
        { id: In(roleIds), company_id: IsNull() },
        { id: In(roleIds), company_id: companyId },
      ],
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid or not accessible');
    }

    // Get existing assignments
    const existing = await this.userRoleRepository.find({
      where: {
        user_id: userId,
        role_id: In(roleIds),
        company_id: companyId,
      },
    });

    const existingRoleIds = new Set(existing.map(e => e.role_id));
    const newRoleIds = roleIds.filter(id => !existingRoleIds.has(id));

    // Create new assignments
    if (newRoleIds.length > 0) {
      const newAssignments = newRoleIds.map(roleId =>
        this.userRoleRepository.create({
          user_id: userId,
          role_id: roleId,
          company_id: companyId,
        })
      );

      await this.userRoleRepository.save(newAssignments);
    }
  }

  /**
   * Replace all user roles (remove old, assign new)
   */
  async replaceUserRoles(userId: number, roleIds: number[], companyId: number): Promise<void> {
    // Remove all existing roles
    const existing = await this.userRoleRepository.find({
      where: { user_id: userId, company_id: companyId },
    });

    if (existing.length > 0) {
      await this.userRoleRepository.remove(existing);
    }

    // Assign new roles
    if (roleIds.length > 0) {
      await this.bulkAssignRoles(userId, roleIds, companyId);
    }
  }
}
