import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreatePreinscriptionDto } from './dto/create-preinscription.dto';
import { UpdatePreinscriptionDto } from './dto/update-preinscription.dto';
import { PreInscription } from './entities/preinscription.entity';
import { Company } from '../company/entities/company.entity';
import { StudentsService } from '../students/students.service';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { PreinscriptionsQueryDto } from './dto/preinscriptions-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class PreinscriptionsService {
  constructor(
    @InjectRepository(PreInscription)
    private readonly repo: Repository<PreInscription>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly studentsService: StudentsService,
  ) {}

  private async resolveCompanyByPublicToken(publicToken: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { publicToken, status: Not(-2) },
    });
    if (!company) {
      throw new NotFoundException('Company not found for the provided public token');
    }
    return company;
  }

  async create(createPreinscriptionDto: CreatePreinscriptionDto): Promise<PreInscription> {
    const entity = this.repo.create(createPreinscriptionDto);
    return this.repo.save(entity);
  }

  /**
   * Public endpoint: create a pre-inscription using company publicToken.
   * Used before any user is connected.
   */
  async createForPublicToken(
    publicToken: string,
    createPreinscriptionDto: CreatePreinscriptionDto,
  ): Promise<PreInscription> {
    const company = await this.resolveCompanyByPublicToken(publicToken);
    const payload: CreatePreinscriptionDto = {
      ...createPreinscriptionDto,
      company_id: company.id,
    };
    return this.create(payload);
  }

  /**
   * Find a pre-inscription by company publicToken and student email.
   * Used to pre-fill/synchronize data when the student starts registration.
   */
  async findByPublicTokenAndEmail(
    publicToken: string,
    email: string,
  ): Promise<PreInscription> {
    const company = await this.resolveCompanyByPublicToken(publicToken);
    const preinscription = await this.repo.findOne({
      where: { company_id: company.id, email },
    });
    if (!preinscription) {
      throw new NotFoundException(
        'Pre-inscription not found for this company and email',
      );
    }
    return preinscription;
  }

  async findAll(): Promise<PreInscription[]> {
    return this.repo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findAllByCompany(
    query: PreinscriptionsQueryDto,
    companyId: number,
  ): Promise<PaginatedResponseDto<PreInscription>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('pre')
      .where('pre.company_id = :companyId', { companyId })
      .orderBy('pre.created_at', 'DESC');

    if (query.search) {
      const search = `%${query.search}%`;
      qb.andWhere(
        '(pre.first_name LIKE :search OR pre.last_name LIKE :search OR pre.email LIKE :search OR pre.city LIKE :search OR pre.desired_formation LIKE :search)',
        { search },
      );
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number): Promise<PreInscription> {
    const preinscription = await this.repo.findOne({ where: { id } });
    if (!preinscription) {
      throw new NotFoundException(`Pre-inscription with id ${id} not found`);
    }
    return preinscription;
  }

  async findOneByCompany(id: number, companyId: number): Promise<PreInscription> {
    const preinscription = await this.repo.findOne({
      where: { id, company_id: companyId },
    });
    if (!preinscription) {
      throw new NotFoundException(`Pre-inscription with id ${id} not found`);
    }
    return preinscription;
  }

  async update(
    id: number,
    updatePreinscriptionDto: UpdatePreinscriptionDto,
  ): Promise<PreInscription> {
    const existing = await this.findOne(id);
    const merged = this.repo.merge(existing, updatePreinscriptionDto);
    return this.repo.save(merged);
  }

  async updateByCompany(
    id: number,
    companyId: number,
    updatePreinscriptionDto: UpdatePreinscriptionDto,
  ): Promise<PreInscription> {
    const existing = await this.findOneByCompany(id, companyId);
    // Prevent changing company_id from payload
    const dtoWithoutCompany = { ...updatePreinscriptionDto } as any;
    delete dtoWithoutCompany.company_id;
    const merged = this.repo.merge(existing, dtoWithoutCompany);
    merged.company_id = companyId;
    return this.repo.save(merged);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }

  async removeByCompany(id: number, companyId: number): Promise<void> {
    const existing = await this.findOneByCompany(id, companyId);
    await this.repo.remove(existing);
  }

  /**
   * Synchronize a pre-inscription into the students/users tables.
   * Behaves like creating a new student: uses StudentsService.create under the hood.
   * Throws if student/user with this email already exists for the company.
   */
  async syncToStudent(preinscriptionId: number, companyIdFromUser: number) {
    const pre = await this.findOne(preinscriptionId);

    if (pre.company_id !== companyIdFromUser) {
      throw new BadRequestException(
        'Pre-inscription does not belong to your company',
      );
    }

    const dto: CreateStudentDto = {
      first_name: pre.first_name,
      last_name: pre.last_name,
      email: pre.email,
      phone: pre.whatsapp_phone,
      nationality: pre.nationality,
      city: pre.city,
      // Other CreateStudentDto fields remain optional / undefined
    };

    return this.studentsService.create(dto, companyIdFromUser);
  }

  /**
   * Synchronize multiple pre-inscriptions into students/users in one call.
   * Returns per-ID status: created, skipped_existing, or error.
   */
  async syncManyToStudents(ids: number[], companyIdFromUser: number) {
    const results: {
      id: number;
      status: 'created' | 'skipped_existing' | 'error';
      message?: string;
      student?: any;
    }[] = [];

    for (const id of ids) {
      try {
        const student = await this.syncToStudent(id, companyIdFromUser);
        results.push({ id, status: 'created', student });
      } catch (error: any) {
        // If student/user already exists, mark as skipped but do not fail the whole batch
        if (error instanceof BadRequestException) {
          results.push({
            id,
            status: 'skipped_existing',
            message: error.message,
          });
          continue;
        }
        results.push({
          id,
          status: 'error',
          message: error?.message ?? 'Unknown error',
        });
      }
    }

    return results;
  }
}
