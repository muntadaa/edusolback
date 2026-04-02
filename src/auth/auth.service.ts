import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PagesService } from '../pages/pages.service';
import { MailService } from '../mail/mail.service';
import { MailTemplateService } from '../mail/mail-template.service';
import { CaptchaService } from '../captcha/captcha.service';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Page } from '../pages/entities/page.entity';
import { RolePage } from '../pages/entities/role-page.entity';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, ResetPasswordWithTokenDto, ChangePasswordDto, SetPasswordDto, ValidateTokenDto } from './dto/auth.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';
import { StudentAccountingService } from '../student-accounting/student-accounting.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private pagesService: PagesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private mailTemplateService: MailTemplateService,
    private captchaService: CaptchaService,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Page)
    private pageRepository: Repository<Page>,
    @InjectRepository(RolePage)
    private rolePageRepository: Repository<RolePage>,
    private dataSource: DataSource,
    private studentAccountingService: StudentAccountingService,
  ) { }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.usersService.findByEmail(loginDto.email);

      // Check if user has a password set
      if (!user.password) {
        throw new UnauthorizedException('Please set your password first. Check your email for the invitation link.');
      }

      const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get user roles
      const roleIds = user.userRoles?.map(ur => ur.role.id) || [];
      const roles = user.userRoles?.map(ur => ur.role.code) || [];

      // Load allowed routes for this user's roles
      const allowedPages = await this.pagesService.getAllowedRoutes(roleIds, user.company_id);

      const payload = {
        userId: user.id,
        companyId: user.company_id,
      };

      return {
        token: this.jwtService.sign(payload, { expiresIn: '1h' }),
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          phone: user.phone || null,
          picture: user.picture || null,
          privacyPolicyAccepted: user.privacyPolicyAccepted || false,
          termsAccepted: user.termsAccepted || false,
          consentAcceptedAt: user.consentAcceptedAt || null,
          company_id: user.company_id,
          roles, // Array of role codes
          allowedPages, // Array of allowed page routes
          company: user.company ? {
            id: user.company.id,
            name: user.company.name,
            email: user.company.email,
          } : null,
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw error;
    }
  }

  async register(registerDto: RegisterDto) {
    // Register endpoint requires company_id in the DTO
    if (!registerDto.company_id) {
      throw new BadRequestException('company_id is required for registration');
    }

    // Validate consent - both privacy policy and terms must be accepted
    if (registerDto.privacyPolicyAccepted !== true || registerDto.termsAccepted !== true) {
      throw new BadRequestException('You must accept the Privacy Policy and Terms of Use');
    }
    
    // Check if this is the first user for this company (first admin of the company)
    const userCountForCompany = await this.usersService.countUsersByCompany(registerDto.company_id);
    const isFirstUserForCompany = userCountForCompany === 0;
    
    // For first user of a company (initial setup), skip CAPTCHA verification
    // The CAPTCHA was already verified when creating the company
    // This allows the company+admin user creation flow to work smoothly
    if (!isFirstUserForCompany) {
      // For subsequent users, CAPTCHA is required
      if (!registerDto.captchaToken) {
        throw new BadRequestException('CAPTCHA token is required for user registration');
      }
      
      // Verify CAPTCHA for subsequent users
      try {
        await this.captchaService.verifyCaptcha(
          registerDto.captchaToken,
          registerDto.captchaAnswer, // Optional if pre-verified
          true, // checkPreVerified = true: only check if token was pre-verified
        );
      } catch (error) {
        // If pre-verified check fails, fall back to normal verification for backward compatibility
        if (registerDto.captchaAnswer) {
          await this.captchaService.verifyCaptcha(
            registerDto.captchaToken,
            registerDto.captchaAnswer,
            false, // Normal verification
          );
        } else {
          throw error; // Re-throw if no answer provided and not pre-verified
        }
      }
    } else {
      // First user: Skip CAPTCHA (already verified during company creation)
      // Token is optional and can be omitted
      console.log(`✅ Skipping CAPTCHA verification for first user of company ${registerDto.company_id} (CAPTCHA was already verified during company creation)`);
    }
    
    // If first user for this company, automatically assign admin role with restricted pages
    let roleIds: number[] = [];
    if (isFirstUserForCompany) {
      // Find admin role - roles should be seeded on startup
      const adminRole = await this.usersService.findRoleByCode('admin', registerDto.company_id);
      
      if (!adminRole) {
        throw new BadRequestException('Admin role not found. Please ensure system roles are seeded. Restart the application to seed roles.');
      }
      
      // Restrict admin role to only /settings and /users pages for this company
      await this.restrictAdminRolePages(adminRole.id, registerDto.company_id);
      
      roleIds = [adminRole.id];
      this.logger.log(`✅ First user for company ${registerDto.company_id} detected - assigning admin role with restricted pages (/settings, /settings/access, /settings/roles, /settings/colors, /users)`);
    }
    // If not first user, user is created without roles (admin must assign roles later via /users endpoint)
    
    // Convert RegisterDto to CreateUserDto format
    const createUserDto = {
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      phone: registerDto.phone,
      picture: registerDto.picture,
      privacyPolicyAccepted: registerDto.privacyPolicyAccepted,
      termsAccepted: registerDto.termsAccepted,
      consentAcceptedAt: new Date(), // Timestamp when consent was accepted
      role_ids: roleIds, // Empty array if not first user (no roles assigned)
    };
    
    return await this.usersService.create(createUserDto, registerDto.company_id);
  }

  async forgotPassword(email: string, captchaToken?: string, captchaAnswer?: string | number) {
    // CAPTCHA is optional for forgot-password - only verify if provided
    if (captchaToken) {
      try {
        await this.captchaService.verifyCaptcha(
          captchaToken,
          captchaAnswer, // Optional if pre-verified
          true, // checkPreVerified = true: only check if token was pre-verified
        );
      } catch (error) {
        // If pre-verified check fails, fall back to normal verification for backward compatibility
        if (captchaAnswer) {
          await this.captchaService.verifyCaptcha(
            captchaToken,
            captchaAnswer,
            false, // Normal verification
          );
        } else {
          throw error; // Re-throw if no answer provided and not pre-verified
        }
      }
    }

    try {
      const user = await this.usersService.findByEmail(email);

      const payload = {
        userId: user.id,
        email: user.email,
      };

      const resetToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('RESET_TOKEN_SECRET'),
        expiresIn: '15m'
      });

      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

      const html = this.mailTemplateService.renderTemplate('password-reset', {
        username: user.username,
        resetLink: resetLink,
      });

      await this.mailService.sendMail(user.email, 'Password Reset Request', html);

      return { message: 'Reset link sent to your email' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('RESET_TOKEN_SECRET')
      });

      // For password reset, we need to find user without company filter (reset tokens don't have company_id)
      // Use findByEmail or create a method that doesn't require company_id
      const user = await this.usersService.findByEmail(decoded.email);

      // Update the user's password - the entity's @BeforeUpdate hook will hash it automatically
      await this.usersService.update(user.id, { password: newPassword }, user.company_id);

      return { message: 'Password successfully updated' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto, companyId: number) {
    // Validate password confirmation
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new UnauthorizedException('New passwords do not match');
    }

    const user = await this.usersService.findOne(userId, companyId);

    // Check if user has a password set
    if (!user.password) {
      throw new UnauthorizedException('Please set your password first using the invitation link.');
    }

    // Verify current password
    const currentPasswordMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!currentPasswordMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password - the entity's @BeforeUpdate hook will hash it automatically
    await this.usersService.update(user.id, { password: changePasswordDto.newPassword }, companyId);

    return { message: 'Password has been changed successfully' };
  }

  /**
   * Validates a password set token
   * @param token The plain token to validate
   * @returns User information if token is valid
   */
  async validatePasswordSetToken(token: string) {
    const user = await this.usersService.validatePasswordSetToken(token);
    return {
      valid: true,
      email: user.email,
      username: user.username,
    };
  }

  /**
   * Sets password using a valid token
   * @param setPasswordDto DTO containing token, password, and confirmPassword
   * @returns Success message
   */
  async setPassword(setPasswordDto: SetPasswordDto) {
    // Validate password confirmation
    if (setPasswordDto.password !== setPasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.setPasswordWithToken(setPasswordDto.token, setPasswordDto.password);

    // Activate linked Student record (if any).
    // Do NOT depend on user.userRoles being loaded here.
    try {
      const student = await this.studentRepository.findOne({
        where: { email: user.email, company_id: user.company_id },
      });
      if (student) {
        student.status = 1;
        await this.studentRepository.save(student);
        await this.studentAccountingService.syncStudentObligations(student.id, student.company_id);
      }
    } catch (error) {
      // Log error but don't fail password setting
      console.error('Failed to update student status:', error);
    }

    // Activate linked Teacher record (if any).
    try {
      const teacher = await this.teacherRepository.findOne({
        where: { email: user.email, company_id: user.company_id },
      });
      if (teacher) {
        teacher.status = 1;
        await this.teacherRepository.save(teacher);
      }
    } catch (error) {
      // Log error but don't fail password setting
      console.error('Failed to update teacher status:', error);
    }

    return { message: 'Password has been set successfully. You can now login.' };
  }

  /**
   * Check if system is already set up (has at least one user globally)
   * Or check if a specific company has admins
   */
  async checkSystemSetup(companyId?: number) {
    if (companyId) {
      // Check if company has any users
      const userCountForCompany = await this.usersService.countUsersByCompany(companyId);
      const isSetup = userCountForCompany > 0;
      
      return {
        isSetup,
        company_id: companyId,
        message: isSetup 
          ? `Company ${companyId} already has users. Use /auth/register or /auth/login instead.`
          : `Company ${companyId} has no users. Use /auth/setup-admin to create the first admin for this company.`,
      };
    } else {
      // Check global setup
      const userCount = await this.usersService.countAllUsers();
      const isSetup = userCount > 0;
      
      return {
        isSetup,
        message: isSetup 
          ? 'System is already set up. Use /auth/register or /auth/login instead.'
          : 'System is not set up. Use /auth/setup-admin to create the first admin.',
      };
    }
  }

  /**
   * Setup first admin user for a company (only works if company has no users)
   */
  async setupFirstAdmin(setupAdminDto: SetupAdminDto) {
    // Verify company exists
    if (!setupAdminDto.company_id) {
      throw new BadRequestException('company_id is required');
    }

    // Check if company already has users
    const userCountForCompany = await this.usersService.countUsersByCompany(setupAdminDto.company_id);
    if (userCountForCompany > 0) {
      throw new BadRequestException(`Company ${setupAdminDto.company_id} already has users. First admin already exists for this company. Use /auth/register or /auth/login instead.`);
    }

    // Find admin role - roles should be seeded on startup
    const adminRole = await this.usersService.findRoleByCode('admin', setupAdminDto.company_id);
    
    if (!adminRole) {
      throw new BadRequestException('Admin role not found. Please ensure system roles are seeded. Restart the application to seed roles.');
    }

    // Restrict admin role to only /settings and /users pages for this company
    await this.restrictAdminRolePages(adminRole.id, setupAdminDto.company_id);

    // Create first admin user for this company with admin role
    const createUserDto = {
      username: setupAdminDto.username,
      email: setupAdminDto.email,
      password: setupAdminDto.password,
      role_ids: [adminRole.id],
    };

    const result = await this.usersService.create(createUserDto, setupAdminDto.company_id);
    
    return {
      message: `First admin user for company ${setupAdminDto.company_id} created successfully. You can now login.`,
      user: result.user,
    };
  }

  /**
   * Restricts the admin role to only have access to specific pages for a specific company
   * Default admin pages: core /settings/* including /settings/types/* (link, classroom, planning, class-rooms), events, etc.
   * This is called when creating the first admin user for a company
   * If pages don't exist, they will be created automatically
   * @param adminRoleId The ID of the admin role
   * @param companyId The company ID
   */
  private async restrictAdminRolePages(adminRoleId: number, companyId: number): Promise<void> {
    try {
      // Define the default pages that new admins should have access to
      const defaultAdminRoutes = [
        { route: '/settings', title: 'Settings' },
        { route: '/settings/access', title: 'Page Access Management' },
        { route: '/settings/roles', title: 'Roles Management' },
        { route: '/settings/colors', title: 'Color Settings' },
        { route: '/settings/company', title: 'Company Settings' },
        { route: '/settings/user', title: 'User Settings' },
        { route: '/settings/types', title: 'Types Settings' },
        { route: '/settings/types/link', title: 'Link Types' },
        { route: '/settings/types/classroom', title: 'Classroom Types' },
        { route: '/settings/types/planning', title: 'Planning Session Types' },
        { route: '/settings/types/class-rooms', title: 'Class Rooms' },
        { route: '/settings/pdf-layout', title: 'Settings - PDF Layout' },
        { route: '/settings/events', title: 'Events' },
        { route: '/settings/required-documents', title: 'Settings - Required Documents' },
      ];

      // Find all required pages (global pages)
      const routeStrings = defaultAdminRoutes.map(r => r.route);
      let pages = await this.pageRepository.find({
        where: { route: In(routeStrings) },
      });

      // Create a map of routes to pages for easy lookup
      const pageMap = new Map(pages.map(page => [page.route, page]));
      
      // Create any missing pages automatically
      const pagesToCreate: { route: string; title: string }[] = [];
      for (const routeData of defaultAdminRoutes) {
        if (!pageMap.has(routeData.route)) {
          pagesToCreate.push(routeData);
          this.logger.warn(
            `Page '${routeData.route}' not found. Creating it automatically...`
          );
        }
      }

      // Batch create missing pages (optimized)
      if (pagesToCreate.length > 0) {
        try {
          const newPages = pagesToCreate.map(pageData =>
            this.pageRepository.create({
              title: pageData.title,
              route: pageData.route,
            })
          );
          
          // Batch save all missing pages at once
          const savedPages = await this.pageRepository.save(newPages);
          
          // Update pages array and map
          pages.push(...savedPages);
          savedPages.forEach(page => {
            pageMap.set(page.route, page);
          });
        
          this.logger.log(
            `✅ Created ${savedPages.length} missing pages in batch: ${pagesToCreate.map(p => p.route).join(', ')}`
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to batch create pages:`,
            error instanceof Error ? error.message : String(error)
          );
          // Fallback: try creating one by one
          for (const pageData of pagesToCreate) {
            try {
              const newPage = this.pageRepository.create({
                title: pageData.title,
                route: pageData.route,
              });
              const savedPage = await this.pageRepository.save(newPage);
              pages.push(savedPage);
              pageMap.set(pageData.route, savedPage);
              this.logger.log(`✅ Created missing page: ${pageData.route}`);
            } catch (err: any) {
              this.logger.error(
                `Failed to create page '${pageData.route}':`,
                err instanceof Error ? err.message : String(err)
              );
            }
          }
        }
      }

      // Remove all existing role-page assignments for this admin role and company
      const deleteResult = await this.rolePageRepository.delete({
        role_id: adminRoleId,
        company_id: companyId,
      });
      this.logger.debug(
        `Deleted ${deleteResult.affected || 0} existing role-page assignments for role ${adminRoleId}, company ${companyId}`
      );

      // Assign all required pages
      const assignments: RolePage[] = [];
      const pageIdsToAssign: number[] = [];
      
      for (const routeData of defaultAdminRoutes) {
        const page = pageMap.get(routeData.route);
        if (page) {
          const assignment = this.rolePageRepository.create({
            role_id: adminRoleId,
            page_id: page.id,
            company_id: companyId,
          });
          assignments.push(assignment);
          pageIdsToAssign.push(page.id);
          this.logger.debug(
            `Prepared assignment: role ${adminRoleId} -> page ${page.id} (${routeData.route}) for company ${companyId}`
          );
        } else {
          this.logger.error(
            `❌ Critical: Page '${routeData.route}' still not found after creation attempt. Skipping assignment.`
          );
        }
      }

      if (assignments.length > 0) {
        // OPTIMIZED: Use batch INSERT with raw SQL for maximum performance
        // This is much faster than individual saves (1 query vs 5+ queries)
        try {
          // Build batch INSERT query with all values at once
          const values = assignments.map(a => `(${adminRoleId}, ${a.page_id}, ${companyId}, NOW())`).join(', ');
          const insertQuery = `
            INSERT IGNORE INTO role_pages (role_id, page_id, company_id, created_at)
            VALUES ${values}
          `;

          // Execute batch insert
          await this.dataSource.query(insertQuery);
          
          this.logger.debug(
            `Batch inserted ${assignments.length} role-page assignments in a single query`
          );

          // Verify what was actually saved (safety check)
          const verifiedAssignments = await this.rolePageRepository.find({
            where: {
              role_id: adminRoleId,
              company_id: companyId,
              page_id: In(pageIdsToAssign),
            },
          });

          const verifiedPageIds = new Set(verifiedAssignments.map(a => a.page_id));
          const verifiedRoutes = verifiedAssignments.map(a => {
            const page = pages.find(p => p.id === a.page_id);
            return page?.route;
          }).filter(Boolean).join(', ');

          if (verifiedAssignments.length === assignments.length) {
            this.logger.log(
              `✅ Restricted admin role ${adminRoleId} for company ${companyId} to ` +
              `${verifiedAssignments.length} pages: ${verifiedRoutes}`
            );
          } else {
            // Some assignments failed - retry missing ones individually
            const missingPageIds = pageIdsToAssign.filter(id => !verifiedPageIds.has(id));
            const missingRoutes = missingPageIds.map(id => {
              const page = pages.find(p => p.id === id);
              return page?.route || `page_id:${id}`;
            });

            this.logger.warn(
              `⚠️ Batch insert saved ${verifiedAssignments.length} of ${assignments.length} pages. ` +
              `Retrying missing: ${missingRoutes.join(', ')}`
            );

            // Retry missing assignments individually
            for (const missingPageId of missingPageIds) {
              try {
                const page = pages.find(p => p.id === missingPageId);
                const assignment = this.rolePageRepository.create({
                  role_id: adminRoleId,
                  page_id: missingPageId,
                  company_id: companyId,
                });
                await this.rolePageRepository.save(assignment);
                this.logger.log(`✅ Retry: Saved assignment for page ${missingPageId} (${page?.route || 'unknown'})`);
              } catch (retryError: any) {
                const page = pages.find(p => p.id === missingPageId);
                this.logger.error(
                  `❌ Retry failed for page ${missingPageId} (${page?.route || 'unknown'}):`,
                  retryError instanceof Error ? retryError.message : String(retryError)
                );
              }
            }
          }
        } catch (error: any) {
          // Fallback: If batch insert fails, save individually
          this.logger.warn(
            `Batch insert failed, falling back to individual saves:`,
            error instanceof Error ? error.message : String(error)
          );

          let successCount = 0;
          for (const assignment of assignments) {
            try {
              await this.rolePageRepository.save(assignment);
              const page = pages.find(p => p.id === assignment.page_id);
              this.logger.debug(`✅ Saved assignment: ${page?.route || assignment.page_id}`);
              successCount++;
            } catch (individualError: any) {
              const page = pages.find(p => p.id === assignment.page_id);
              this.logger.error(
                `❌ Failed to save assignment for page ${assignment.page_id} (${page?.route || 'unknown'}):`,
                individualError instanceof Error ? individualError.message : String(individualError)
              );
            }
          }
          this.logger.log(`Fallback completed: ${successCount} of ${assignments.length} assignments saved`);
        }

        if (assignments.length < defaultAdminRoutes.length) {
          const missing = defaultAdminRoutes
            .filter(r => !assignments.some(a => {
              const page = pages.find(p => p.id === a.page_id);
              return page?.route === r.route;
            }))
            .map(r => r.route);
          this.logger.warn(
            `⚠️ Some pages could not be assigned: ${missing.join(', ')}`
          );
        }
      } else {
        this.logger.error(
          `❌ CRITICAL: No pages assigned to admin role ${adminRoleId} for company ${companyId}. ` +
          `This should not happen if pages seeder is working correctly.`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to restrict admin role pages for company ${companyId}:`,
        error instanceof Error ? error.message : String(error)
      );
      // Don't throw - allow user creation to proceed even if page restriction fails
      // This prevents blocking user registration if pages aren't initialized yet
    }
  }
}