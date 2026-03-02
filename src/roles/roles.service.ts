import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleQueryDto } from './dto/role-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * Create a new role for a company
   * System roles can only be created with is_system=true and company_id=null
   */
  async create(createRoleDto: CreateRoleDto, companyId: number | null): Promise<Role> {
    // If creating a system role, company_id must be null
    if (createRoleDto.is_system && companyId !== null) {
      throw new BadRequestException('System roles must have company_id as null');
    }

    // If not a system role, company_id is required
    if (!createRoleDto.is_system && companyId === null) {
      throw new BadRequestException('Company-specific roles require a company_id');
    }

    // Check if code already exists for this company (or as system role if creating system role)
    const existingRole = await this.roleRepository.findOne({
      where: { 
        code: createRoleDto.code,
        company_id: companyId === null ? IsNull() : companyId, // Unique per company (null for system roles)
      },
    });

    if (existingRole) {
      throw new BadRequestException(`Role with code '${createRoleDto.code}' already exists`);
    }

    const role = this.roleRepository.create({
      ...createRoleDto,
      company_id: companyId,
      is_system: createRoleDto.is_system || false,
    });

    return await this.roleRepository.save(role);
  }

  /**
   * Get all roles with search and pagination
   * Returns system roles and company-specific roles
   */
  async findAll(queryDto: RoleQueryDto, companyId: number | null): Promise<PaginatedResponseDto<Role>> {
    const { page = 1, limit = 10, search, is_system } = queryDto;

    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    // Apply base filter based on is_system filter and company context
    if (is_system === true) {
      // Filter for system roles only: company_id must be NULL
      queryBuilder.where('role.company_id IS NULL');
    } else if (is_system === false) {
      // Filter for custom roles only: company_id must match the user's company
      if (companyId === null) {
        // If no company context, there are no custom roles to show
        queryBuilder.where('1 = 0'); // Return no results
      } else {
        queryBuilder.where('role.company_id = :companyId', { companyId });
      }
    } else {
      // No is_system filter: show both system roles and company-specific roles
      if (companyId !== null) {
        queryBuilder.where('(role.company_id = :companyId OR role.company_id IS NULL)', { companyId });
      } else {
        // If no company context, only show system roles
        queryBuilder.where('role.company_id IS NULL');
      }
    }

    // Apply is_system filter (if provided)
    // When is_system is undefined → return all roles (already handled above)
    // When is_system is true → return only system roles (already handled above)
    // When is_system is false → return only custom roles (already handled above)
    if (is_system !== undefined) {
      queryBuilder.andWhere('role.is_system = :is_system', { is_system });
    }

    // Apply search filter (case-insensitive using LOWER for MySQL compatibility)
    if (search) {
      const searchTerm = search.trim();
      queryBuilder.andWhere(
        '(LOWER(role.code) LIKE LOWER(:search) OR LOWER(role.label) LIKE LOWER(:search))',
        { search: `%${searchTerm}%` }
      );
    }

    // Exclude deprecated 'prof' role
    queryBuilder.andWhere('role.code != :profCode', { profCode: 'prof' });

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order results
    queryBuilder.orderBy('role.label', 'ASC');

    // Get total count and paginated results
    const [roles, total] = await queryBuilder.getManyAndCount();

    return PaginationService.createResponse(roles, page, limit, total);
  }

  /**
   * Get a single role by ID
   */
  async findOne(id: number, companyId: number | null): Promise<Role> {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .where('role.id = :id', { id });

    // Ensure user can only access system roles or their company's roles
    if (companyId !== null) {
      queryBuilder.andWhere('(role.company_id = :companyId OR role.company_id IS NULL)', { companyId });
    } else {
      queryBuilder.andWhere('role.company_id IS NULL');
    }

    const role = await queryBuilder.getOne();

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  /**
   * Find role by code
   */
  async findByCode(code: string, companyId: number | null): Promise<Role | null> {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .where('role.code = :code', { code });

    if (companyId !== null) {
      queryBuilder.andWhere('(role.company_id = :companyId OR role.company_id IS NULL)', { companyId });
    } else {
      queryBuilder.andWhere('role.company_id IS NULL');
    }

    return await queryBuilder.getOne();
  }

  /**
   * Update a role
   * System roles cannot have their code or is_system changed
   */
  async update(id: number, updateRoleDto: UpdateRoleDto, companyId: number | null): Promise<Role> {
    const role = await this.findOne(id, companyId);

    // System roles cannot be modified (except label)
    if (role.is_system) {
      if (updateRoleDto.code && updateRoleDto.code !== role.code) {
        throw new ForbiddenException('Cannot change code of a system role');
      }
      if (updateRoleDto.is_system !== undefined && updateRoleDto.is_system !== role.is_system) {
        throw new ForbiddenException('Cannot change is_system flag of a system role');
      }
    }

    // If updating code, check for duplicates within the same company
    if (updateRoleDto.code && updateRoleDto.code !== role.code) {
      const existingRole = await this.roleRepository.findOne({
        where: { 
          code: updateRoleDto.code,
          company_id: role.company_id === null ? IsNull() : role.company_id, // Check within same company context
        },
      });

      if (existingRole) {
        throw new BadRequestException(`Role with code '${updateRoleDto.code}' already exists`);
      }
    }

    Object.assign(role, updateRoleDto);
    return await this.roleRepository.save(role);
  }

  /**
   * Delete a role
   * System roles cannot be deleted
   */
  async remove(id: number, companyId: number | null): Promise<void> {
    const role = await this.findOne(id, companyId);

    if (role.is_system) {
      throw new ForbiddenException('Cannot delete a system role');
    }

    // Only allow deletion of company-specific roles by the same company
    if (role.company_id !== companyId) {
      throw new ForbiddenException('Cannot delete roles from other companies');
    }

    await this.roleRepository.remove(role);
  }

  /**
   * Get all system roles
   */
  async getSystemRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
      where: { company_id: IsNull(), is_system: true },
      order: { label: 'ASC' },
    });
  }

  /**
   * Get all roles for a company (system + company-specific)
   */
  async getCompanyRoles(companyId: number): Promise<Role[]> {
    return await this.roleRepository.find({
      where: [
        { company_id: IsNull() }, // System roles
        { company_id: companyId }, // Company-specific roles
      ],
      order: { label: 'ASC' },
    });
  }
}
