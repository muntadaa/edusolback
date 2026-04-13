import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { CompanyQueryDto } from './dto/company-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { CaptchaService } from '../captcha/captcha.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private captchaService: CaptchaService,
  ) {}

  private async generateUniquePublicToken(): Promise<string> {
    // Generate a random token and ensure it's unique among companies
    // Length 32 hex chars is enough; can be adjusted if needed
    let token: string;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      token = randomBytes(16).toString('hex');
      const existing = await this.companyRepository.findOne({
        where: { publicToken: token },
      });
      if (!existing) break;
    }
    return token;
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    // Verify CAPTCHA using pre-verified flow
    // Token should have been pre-verified via /api/captcha/pre-verify endpoint
    // This just checks if it was pre-verified and marks it as used
    try {
      await this.captchaService.verifyCaptcha(
        createCompanyDto.captchaToken,
        createCompanyDto.captchaAnswer, // Optional if pre-verified
        true, // checkPreVerified = true: only check if token was pre-verified
      );
    } catch (error) {
      // If pre-verified check fails, fall back to normal verification for backward compatibility
      if (createCompanyDto.captchaAnswer) {
        await this.captchaService.verifyCaptcha(
          createCompanyDto.captchaToken,
          createCompanyDto.captchaAnswer,
          false, // Normal verification
        );
      } else {
        throw error; // Re-throw if no answer provided and not pre-verified
      }
    }

    // Remove CAPTCHA fields before creating company
    const { captchaToken, captchaAnswer, ...companyData } = createCompanyDto;

    const company = this.companyRepository.create(companyData);
    // Generate a publicToken on creation so it can be used for public pre-inscriptions
    company.publicToken = await this.generateUniquePublicToken();
    return await this.companyRepository.save(company);
  }

  async findAll(query: CompanyQueryDto): Promise<PaginatedResponseDto<Company>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.companyRepository.createQueryBuilder('c').leftJoinAndSelect('c.users', 'users');

    qb.andWhere('c.status <> :deletedStatus', { deletedStatus: -2 });

    if (query.search) {
      qb.andWhere('(c.name LIKE :search OR c.email LIKE :search OR c.city LIKE :search OR c.country LIKE :search)', { search: `%${query.search}%` });
    }

    if (query.status !== undefined) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    qb.orderBy('c.id', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id, status: Not(-2) },
      relations: ['users'],
    });
    
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    
    return company;
  }

  async findByPublicToken(publicToken: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { publicToken, status: Not(-2) },
    });
    if (!company) {
      throw new NotFoundException('Company not found for the provided public token');
    }
    return company;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);
    
    Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(company);
  }

  async remove(id: number): Promise<void> {
    const company = await this.findOne(id);
    await this.companyRepository.remove(company);
  }
}
