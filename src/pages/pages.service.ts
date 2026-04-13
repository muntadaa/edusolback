import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Page } from './entities/page.entity';
import { RolePage } from './entities/role-page.entity';
import { Role } from '../roles/entities/role.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { AssignRolePageDto } from './dto/assign-role-page.dto';
import { CreatePagesFromRoutesDto } from './dto/create-pages-from-routes.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    @InjectRepository(Page)
    private pageRepository: Repository<Page>,
    @InjectRepository(RolePage)
    private rolePageRepository: Repository<RolePage>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * Get all allowed routes for a user's roles
   * Users with 'admin' role get all global pages, others get routes from role_pages for their company
   */
  async getAllowedRoutes(roleIds: number[], companyId: number): Promise<string[]> {
    // Check if user has admin role
    const adminRole = await this.roleRepository.findOne({
      where: { code: 'admin', company_id: In([companyId, null]) },
    });

    if (adminRole && roleIds.includes(adminRole.id)) {
      // Admin has access to all global pages
      const allPages = await this.pageRepository.find({
        select: ['route'],
      });
      return allPages.map(page => page.route);
    }

    // For other roles, get routes from role_pages for their company
    const rolePages = await this.rolePageRepository.find({
      where: { 
        role_id: In(roleIds),
        company_id: companyId,
      },
      relations: ['page'],
    });

    // Get unique routes
    const routes = rolePages.map(rp => rp.page.route);
    return [...new Set(routes)];
  }

  /**
   * Check if a user with given roles has access to a specific route in a company
   */
  async hasAccessToRoute(roleIds: number[], route: string, companyId: number): Promise<boolean> {
    // Check if page exists globally
    const page = await this.pageRepository.findOne({
      where: { route },
    });

    if (!page) {
      return false;
    }

    // Check if user has admin role
    const adminRole = await this.roleRepository.findOne({
      where: { code: 'admin', company_id: In([companyId, null]) },
    });

    if (adminRole && roleIds.includes(adminRole.id)) {
      // Admin has access to all global pages
      return true;
    }

    // Check if route exists in role_pages for these roles and company
    const rolePage = await this.rolePageRepository
      .createQueryBuilder('rp')
      .innerJoin('rp.page', 'page')
      .where('rp.role_id IN (:...roleIds)', { roleIds })
      .andWhere('rp.company_id = :companyId', { companyId })
      .andWhere('page.route = :route', { route })
      .getOne();

    return !!rolePage;
  }

  /**
   * Create a new global page (pages are global for all companies)
   */
  async create(createPageDto: CreatePageDto): Promise<Page> {
    // Check if route already exists globally
    const existingPage = await this.pageRepository.findOne({
      where: { route: createPageDto.route },
    });

    if (existingPage) {
      throw new BadRequestException(`Page with route '${createPageDto.route}' already exists`);
    }

    const page = this.pageRepository.create(createPageDto);
    return await this.pageRepository.save(page);
  }

  /**
   * Get all global pages with search and pagination
   */
  async findAll(queryDto: PageQueryDto): Promise<PaginatedResponseDto<Page>> {
    const { page = 1, limit = 10, search } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.pageRepository
      .createQueryBuilder('page')
      .skip(skip)
      .take(limit)
      .orderBy('page.route', 'ASC');

    // Add search filter for title or route
    if (search) {
      queryBuilder.andWhere(
        '(page.title LIKE :search OR page.route LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [pages, total] = await queryBuilder.getManyAndCount();

    return PaginationService.createResponse(pages, page, limit, total);
  }

  /**
   * Get a single page by ID (pages are global)
   */
  async findOne(id: number): Promise<Page> {
    const page = await this.pageRepository.findOne({
      where: { id },
      relations: ['rolePages', 'rolePages.role'],
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    return page;
  }

  /**
   * Get a page by route (pages are global)
   */
  async findByRoute(route: string): Promise<Page | null> {
    return await this.pageRepository.findOne({
      where: { route },
      relations: ['rolePages', 'rolePages.role'],
    });
  }

  /**
   * Update a global page
   */
  async update(id: number, updatePageDto: UpdatePageDto): Promise<Page> {
    const page = await this.findOne(id);

    // If route is being updated, check for duplicates globally
    if (updatePageDto.route && updatePageDto.route !== page.route) {
      const existingPage = await this.pageRepository.findOne({
        where: { route: updatePageDto.route },
      });

      if (existingPage) {
        throw new BadRequestException(`Page with route '${updatePageDto.route}' already exists`);
      }
    }

    Object.assign(page, updatePageDto);
    return await this.pageRepository.save(page);
  }

  /**
   * Delete a global page (cascade will remove role_pages entries)
   */
  async remove(id: number): Promise<void> {
    const page = await this.findOne(id);
    await this.pageRepository.remove(page);
  }

  /**
   * Assign a page to a role for a company (role-page assignments are company-specific)
   */
  async assignToRole(assignDto: AssignRolePageDto, companyId: number): Promise<RolePage> {
    // Verify page exists globally
    const page = await this.findOne(assignDto.page_id);

    // Verify role exists and is accessible (system role or company role)
    const role = await this.roleRepository.findOne({
      where: [
        { id: assignDto.role_id, company_id: IsNull() }, // System role
        { id: assignDto.role_id, company_id: companyId }, // Company role
      ],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${assignDto.role_id} not found or not accessible`);
    }

    // Check if assignment already exists
    const existing = await this.rolePageRepository.findOne({
      where: {
        role_id: assignDto.role_id,
        page_id: assignDto.page_id,
        company_id: companyId,
      },
    });

    if (existing) {
      throw new BadRequestException(`Page ${assignDto.page_id} is already assigned to role ${assignDto.role_id} for this company`);
    }

    const rolePage = this.rolePageRepository.create({
      role_id: assignDto.role_id,
      page_id: assignDto.page_id,
      company_id: companyId,
    });

    return await this.rolePageRepository.save(rolePage);
  }

  /**
   * Remove a page assignment from a role for a company
   */
  async removeFromRole(roleId: number, pageId: number, companyId: number): Promise<void> {
    const rolePage = await this.rolePageRepository.findOne({
      where: {
        role_id: roleId,
        page_id: pageId,
        company_id: companyId,
      },
    });

    if (!rolePage) {
      throw new NotFoundException(`Page ${pageId} is not assigned to role ${roleId} for this company`);
    }

    await this.rolePageRepository.remove(rolePage);
  }

  /**
   * Get all pages assigned to a specific role for a company
   */
  async getPagesForRole(roleId: number, companyId: number): Promise<Page[]> {
    const rolePages = await this.rolePageRepository.find({
      where: { 
        role_id: roleId,
        company_id: companyId,
      },
      relations: ['page'],
    });

    return rolePages.map(rp => rp.page);
  }

  /**
   * Get all roles that have access to a specific page for a company
   */
  async getRolesForPage(pageId: number, companyId: number): Promise<Role[]> {
    const rolePages = await this.rolePageRepository.find({
      where: { 
        page_id: pageId,
        company_id: companyId,
      },
      relations: ['role'],
    });

    return rolePages.map(rp => rp.role);
  }

  /**
   * Bulk assign pages to a role for a company (role-page assignments are company-specific)
   */
  async bulkAssignToRole(roleId: number, pageIds: number[], companyId: number): Promise<void> {
    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: [
        { id: roleId, company_id: IsNull() },
        { id: roleId, company_id: companyId },
      ],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found or not accessible`);
    }

    // Verify all pages exist globally
    const pages = await this.pageRepository.find({
      where: { id: In(pageIds) },
    });

    if (pages.length !== pageIds.length) {
      throw new BadRequestException('One or more page IDs are invalid');
    }

    // Get existing assignments
    const existing = await this.rolePageRepository.find({
      where: {
        role_id: roleId,
        page_id: In(pageIds),
        company_id: companyId,
      },
    });

    const existingPageIds = new Set(existing.map(e => e.page_id));
    const newPageIds = pageIds.filter(id => !existingPageIds.has(id));

    // Create new assignments
    if (newPageIds.length > 0) {
      const newAssignments = newPageIds.map(pageId =>
        this.rolePageRepository.create({
          role_id: roleId,
          page_id: pageId,
          company_id: companyId,
        })
      );

      await this.rolePageRepository.save(newAssignments);
    }
  }

  /**
   * Bulk remove page assignments from a role for a company
   */
  async bulkRemoveFromRole(roleId: number, pageIds: number[], companyId: number): Promise<void> {
    const rolePages = await this.rolePageRepository.find({
      where: {
        role_id: roleId,
        page_id: In(pageIds),
        company_id: companyId,
      },
    });

    if (rolePages.length > 0) {
      await this.rolePageRepository.remove(rolePages);
    }
  }

  /**
   * Create multiple global pages from routes array
   * Skips routes that already exist if skipExisting is true
   */
  async createPagesFromRoutes(
    createPagesDto: CreatePagesFromRoutesDto,
  ): Promise<{ created: number; skipped: number; pages: Page[]; errors: string[] }> {
    const { routes, skipExisting = true } = createPagesDto;
    const createdPages: Page[] = [];
    const errors: string[] = [];
    let createdCount = 0;
    let skippedCount = 0;

    // Validate all routes first
    for (const routeData of routes) {
      if (!routeData.route || !routeData.route.startsWith('/')) {
        errors.push(`Invalid route: ${routeData.route} (must start with /)`);
        continue;
      }
      if (!routeData.title || routeData.title.trim().length === 0) {
        errors.push(`Missing title for route: ${routeData.route}`);
        continue;
      }
    }

    // Get all existing routes globally to check duplicates
    const existingPages = await this.pageRepository.find({
      select: ['route'],
    });
    const existingRoutes = new Set(existingPages.map(p => p.route));

    // Create pages
    for (const routeData of routes) {
      const { route, title } = routeData;

      // Skip validation errors
      if (!route || !route.startsWith('/') || !title || title.trim().length === 0) {
        continue;
      }

      // Check if route already exists globally
      if (existingRoutes.has(route)) {
        if (skipExisting) {
          skippedCount++;
          this.logger.debug(`Skipping existing route: ${route}`);
          continue;
        } else {
          errors.push(`Route '${route}' already exists`);
          continue;
        }
      }

      try {
        const page = this.pageRepository.create({
          title: title.trim(),
          route: route,
        });

        const savedPage = await this.pageRepository.save(page);
        createdPages.push(savedPage);
        createdCount++;
        existingRoutes.add(route); // Add to set to prevent duplicates in same batch
      } catch (error: any) {
        this.logger.error(`Failed to create page for route ${route}:`, error);
        errors.push(`Failed to create page for route '${route}': ${error.message}`);
      }
    }

    return {
      created: createdCount,
      skipped: skippedCount,
      pages: createdPages,
      errors,
    };
  }
}

