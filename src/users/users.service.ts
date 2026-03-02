import { Injectable, NotFoundException, BadRequestException, Logger, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, IsNull, QueryFailedError } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { User } from './entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { Role } from '../roles/entities/role.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { MailService } from '../mail/mail.service';
import { MailTemplateService } from '../mail/mail-template.service';
import { ConfigService } from '@nestjs/config';
import { UserRolesService } from '../user-roles/user-roles.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private mailService: MailService,
    private mailTemplateService: MailTemplateService,
    private configService: ConfigService,
    @Inject(forwardRef(() => UserRolesService))
    private userRolesService: UserRolesService,
  ) {}

  /**
   * Generates a secure one-time token for password setting
   * @returns A random token string (32 bytes hex = 64 characters)
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hashes a token using bcrypt for secure storage
   * @param token The plain token to hash
   * @returns Hashed token
   */
  private async hashToken(token: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(token, salt);
  }

  /**
   * Compares a plain token with a hashed token
   * @param plainToken The plain token to compare
   * @param hashedToken The hashed token from database
   * @returns True if tokens match
   */
  private async compareTokens(plainToken: string, hashedToken: string): Promise<boolean> {
    return bcrypt.compare(plainToken, hashedToken);
  }

  async create(createUserDto: CreateUserDto, companyId: number, sendEmail: boolean = true): Promise<{ user: User }> {
    try {
      // Validate company exists
      const company = await this.companyRepository.findOne({
        where: { id: companyId, status: Not(-2) },
      });
      if (!company) {
        throw new BadRequestException(`Company with ID ${companyId} not found`);
      }

      // Check if email already exists in users table (excluding deleted users)
      const existingActiveUser = await this.userRepository.findOne({
        where: { 
          email: createUserDto.email, 
          company_id: companyId,
          status: Not(-2), // Exclude deleted users
        },
      });
      if (existingActiveUser) {
        throw new BadRequestException(`A user with email ${createUserDto.email} already exists`);
      }

      // Check if there's a deleted user with this email - if so, we'll restore it
      const deletedUser = await this.userRepository.findOne({
        where: { 
          email: createUserDto.email, 
          company_id: companyId,
          status: -2, // Only deleted users
        },
      });

      // Check if username already exists in users table (excluding deleted users)
      const existingActiveUsername = await this.userRepository.findOne({
        where: { 
          username: createUserDto.username, 
          company_id: companyId,
          status: Not(-2), // Exclude deleted users
        },
      });
      if (existingActiveUsername) {
        throw new BadRequestException(`A user with username ${createUserDto.username} already exists`);
      }

      // Generate token if password is not provided
      let plainToken: string | undefined;
      let tokenExpiresAt: Date | undefined;
      
      if (!createUserDto.password) {
        plainToken = this.generateSecureToken();
        const hashedToken = await this.hashToken(plainToken);
        
        // Token expires in 24 hours
        tokenExpiresAt = new Date();
        tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);
        
        // Set password to null and store token
        createUserDto.password = null as any;
      }

      let savedUser: User;

      if (deletedUser) {
        // Restore and update the deleted user
        this.logger.log(`Restoring deleted user ${deletedUser.id} with email ${createUserDto.email}`);
        
        // Generate token if password is not provided
        if (plainToken) {
          const hashedToken = await this.hashToken(plainToken);
          Object.assign(deletedUser, {
            username: createUserDto.username,
            email: createUserDto.email,
            phone: createUserDto.phone ?? null,
            picture: createUserDto.picture ?? null,
            privacyPolicyAccepted: createUserDto.privacyPolicyAccepted ?? false,
            termsAccepted: createUserDto.termsAccepted ?? false,
            consentAcceptedAt: createUserDto.consentAcceptedAt ?? null,
            company_id: companyId,
            password: null,
            status: createUserDto.status ?? 2, // Default to pending (2) if not specified
            password_set_token: hashedToken,
            password_set_token_expires_at: tokenExpiresAt,
          });
        } else {
          Object.assign(deletedUser, {
            username: createUserDto.username,
            email: createUserDto.email,
            phone: createUserDto.phone ?? null,
            picture: createUserDto.picture ?? null,
            privacyPolicyAccepted: createUserDto.privacyPolicyAccepted ?? false,
            termsAccepted: createUserDto.termsAccepted ?? false,
            consentAcceptedAt: createUserDto.consentAcceptedAt ?? null,
            company_id: companyId,
            password: createUserDto.password,
            status: createUserDto.status ?? 1,
            password_set_token: null,
            password_set_token_expires_at: null,
          });
        }
        savedUser = await this.userRepository.save(deletedUser);
        this.logger.log(`User account restored with email ${createUserDto.email}`);
        
        // Assign roles if provided (optional for normal users)
        if (createUserDto.role_ids && createUserDto.role_ids.length > 0) {
          await this.userRolesService.replaceUserRoles(savedUser.id, createUserDto.role_ids, companyId);
        } else {
          this.logger.log(`User ${savedUser.id} created/restored without roles. Roles can be assigned later via user update.`);
        }
      } else {
        // Create new user
        const userData: any = {
          ...createUserDto,
          company_id: companyId,
          status: createUserDto.status ?? (createUserDto.password ? 1 : 2), // Active if password provided, pending otherwise
        };

        // Add token fields if password is not provided
        if (plainToken) {
          userData.password_set_token = await this.hashToken(plainToken);
          userData.password_set_token_expires_at = tokenExpiresAt;
        }

        const user = this.userRepository.create(userData);
        savedUser = await this.userRepository.save(user) as unknown as User;
        this.logger.log(`User account created with email ${createUserDto.email}`);
        
        // Assign roles if provided (optional for normal users)
        if (createUserDto.role_ids && createUserDto.role_ids.length > 0) {
          await this.userRolesService.replaceUserRoles(savedUser.id, createUserDto.role_ids, companyId);
        } else {
          this.logger.log(`User ${savedUser.id} created without roles. Roles can be assigned later via user update.`);
        }
      }

      // Send password invitation email if token was generated AND sendEmail is true (non-blocking)
      // For direct user creation, email is always sent automatically
      if (plainToken && sendEmail) {
        this.sendPasswordInvitationEmail(savedUser, plainToken, company).catch((error) => {
          // Log error but don't fail user creation
          this.logger.error(`Failed to send password invitation email to ${savedUser.email}:`, error);
        });
      }

      // Return user only (token is sent via email, not in response)
      return {
        user: savedUser,
      };
    } catch (error) {
      // Re-throw BadRequestException and NotFoundException as-is (they already have clear messages)
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Log the actual error for debugging
      this.logger.error('Failed to create user', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        createUserDto: { ...createUserDto, email: createUserDto.email },
        companyId,
      });
      
      // Handle database errors
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message;
        if (errorMessage.includes('Duplicate entry')) {
          const match = errorMessage.match(/Duplicate entry '(.+?)' for key/);
          if (match) {
            throw new BadRequestException(`Duplicate entry: ${match[1]} already exists`);
          }
          throw new BadRequestException('This record already exists');
        }
        if (errorMessage.includes('foreign key constraint')) {
          throw new BadRequestException('Cannot create user: Invalid reference (company, etc.)');
        }
        if (errorMessage.includes('cannot be null')) {
          throw new BadRequestException('Required field cannot be null');
        }
        if (process.env.NODE_ENV !== 'production') {
          throw new BadRequestException(`Database error: ${errorMessage}`);
        }
      }
      
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Sends a password invitation email with token link to the new user
   * @private
   */
  private async sendPasswordInvitationEmail(user: User, token: string, company: Company): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const setPasswordLink = `${frontendUrl}/set-password?token=${token}`;
    
    const html = this.mailTemplateService.renderTemplate('password-invitation', {
      companyName: company.name || 'Our Platform',
      username: user.username,
      email: user.email,
      setPasswordLink: setPasswordLink,
    });

    await this.mailService.sendMail(
      user.email,
      `Welcome to ${company.name || 'Our Platform'} - Set Your Password`,
      html,
    );
  }

  /**
   * Sends password invitation email for a user by ID
   * @param userId User ID
   * @param companyId Company ID
   * @returns Success message
   */
  async sendPasswordInvitationById(userId: number, companyId: number): Promise<{ message: string }> {
    const user = await this.findOne(userId, companyId);
    return await this.sendPasswordInvitationByEmail(user.email, companyId);
  }

  /**
   * Sends password invitation email for a user by email
   * @param email User email
   * @param companyId Company ID
   * @returns Success message
   */
  async sendPasswordInvitationByEmail(email: string, companyId: number): Promise<{ message: string }> {
    const user = await this.findByEmail(email);
    
    // Verify user belongs to the company
    if (user.company_id !== companyId) {
      throw new BadRequestException('User does not belong to this company');
    }

    // Check if user already has a password
    if (user.password) {
      throw new BadRequestException('User already has a password set');
    }

    // Get company
    const company = await this.companyRepository.findOne({
      where: { id: companyId, status: Not(-2) },
    });
    if (!company) {
      throw new BadRequestException(`Company with ID ${companyId} not found`);
    }

    // Always regenerate token when button is clicked (even if expired or missing)
    // This ensures a fresh token is sent and extends the expiration time
    const plainToken = this.generateSecureToken();
    const hashedToken = await this.hashToken(plainToken);
    
    // Token expires in 24 hours from now
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    // Update user with new token
    user.password_set_token = hashedToken;
    user.password_set_token_expires_at = tokenExpiresAt;
    await this.userRepository.save(user);

    // Send email
    await this.sendPasswordInvitationEmail(user, plainToken, company);

    return { message: 'Password invitation email sent successfully' };
  }

  async findAll(companyId: number): Promise<User[]> {
    return await this.userRepository.find({
      where: { company_id: companyId, status: Not(-2) },
      relations: ['company'],
    });
  }

  async findAllWithPagination(queryDto: UsersQueryDto, companyId: number): Promise<PaginatedResponseDto<User>> {
    const { page = 1, limit = 10, search, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .skip(skip)
      .take(limit)
      .orderBy('user.created_at', 'DESC');

    queryBuilder.andWhere('user.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    queryBuilder.andWhere('user.company_id = :company_id', { company_id: companyId });

    // Add search filter for email or username
    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR user.username LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status !== undefined) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return PaginationService.createResponse(users, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['company', 'userRoles', 'userRoles.role'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email, status: Not(-2) },
      relations: ['company', 'userRoles', 'userRoles.role'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    
    return user;
  }

  /**
   * Count all users in the system (excluding deleted)
   */
  async countAllUsers(): Promise<number> {
    return await this.userRepository.count({
      where: { status: Not(-2) },
    });
  }

  /**
   * Count users for a specific company (excluding deleted)
   */
  async countUsersByCompany(companyId: number): Promise<number> {
    return await this.userRepository.count({
      where: { company_id: companyId, status: Not(-2) },
    });
  }

  /**
   * Find role by code (helper method for first admin registration)
   */
  async findRoleByCode(code: string, companyId: number | null): Promise<Role | null> {
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

  async update(id: number, updateUserDto: UpdateUserDto, companyId: number): Promise<User> {
    const user = await this.findOne(id, companyId);
    
    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...updateUserDto };
    delete (dtoWithoutCompany as any).company_id;
    
    Object.assign(user, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    user.company_id = companyId;
    user.company = { id: companyId } as any;
    
    return await this.userRepository.save(user);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const user = await this.findOne(id, companyId);
    await this.userRepository.remove(user);
  }

  /**
   * Validates a password set token
   * @param token The plain token to validate
   * @returns User if token is valid, throws exception otherwise
   */
  async validatePasswordSetToken(token: string): Promise<User> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.password_set_token IS NOT NULL')
      .andWhere('user.password_set_token_expires_at IS NOT NULL')
      .andWhere('user.password IS NULL')
      .andWhere('user.status != :deletedStatus', { deletedStatus: -2 })
      .leftJoinAndSelect('user.company', 'company')
      .getMany();

    // Find user with matching token
    for (const user of users) {
      if (!user.password_set_token) continue;
      
      const isMatch = await this.compareTokens(token, user.password_set_token);
      if (isMatch) {
        // Check if token is expired
        if (user.password_set_token_expires_at && user.password_set_token_expires_at < new Date()) {
          throw new UnauthorizedException('Token has expired. Please request a new invitation.');
        }
        return user;
      }
    }

    throw new UnauthorizedException('Invalid or expired token');
  }

  /**
   * Sets password for a user using a valid token
   * @param token The plain token
   * @param password The new password to set
   * @returns Updated user
   */
  async setPasswordWithToken(token: string, password: string): Promise<User> {
    const user = await this.validatePasswordSetToken(token);

    // Set password and clear token fields
    user.password = password;
    user.password_set_token = null;
    user.password_set_token_expires_at = null;
    // Set status to active (1) when password is set
    user.status = 1;

    // Save will trigger @BeforeUpdate hook to hash the password
    return await this.userRepository.save(user);
  }
}
