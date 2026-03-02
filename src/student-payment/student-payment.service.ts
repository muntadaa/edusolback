import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';
import { UpdateStudentPaymentDto } from './dto/update-student-payment.dto';
import { StudentPayment } from './entities/student-payment.entity';
import { StudentPaymentQueryDto } from './dto/student-payment-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Student } from '../students/entities/student.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { Level } from '../level/entities/level.entity';
import { LevelPricing } from '../level-pricing/entities/level-pricing.entity';

@Injectable()
export class StudentPaymentService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly repo: Repository<StudentPayment>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
    @InjectRepository(LevelPricing)
    private readonly levelPricingRepo: Repository<LevelPricing>,
  ) {}

  async create(dto: CreateStudentPaymentDto, companyId: number): Promise<StudentPayment> {
    this.validatePaymentAmount(dto.payment, dto.amount);

    // Verify student exists and belongs to the same company
    const student = await this.studentRepo.findOne({
      where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.student_id} not found or does not belong to your company`);
    }

    // Verify school year exists and belongs to the same company
    const schoolYear = await this.schoolYearRepo.findOne({
      where: { id: dto.school_year_id, status: Not(-2) },
      relations: ['company'],
    });
    if (!schoolYear) {
      throw new NotFoundException(`School year with ID ${dto.school_year_id} not found`);
    }
    if (schoolYear.company?.id !== companyId) {
      throw new BadRequestException('School year does not belong to your company');
    }

    // Verify level exists and belongs to the same company
    const level = await this.levelRepo.findOne({
      where: { id: dto.level_id, company_id: companyId, status: Not(-2) },
    });
    if (!level) {
      throw new NotFoundException(`Level with ID ${dto.level_id} not found or does not belong to your company`);
    }

    // Verify level pricing if provided
    if (dto.level_pricing_id) {
      const levelPricing = await this.levelPricingRepo.findOne({
        where: { id: dto.level_pricing_id, company_id: companyId },
      });
      if (!levelPricing) {
        throw new NotFoundException(`Level pricing with ID ${dto.level_pricing_id} not found or does not belong to your company`);
      }
    }

    // Always set company_id from authenticated user
    const entity = this.repo.create({
      ...dto,
      company_id: companyId,
      status: dto.status ?? 2,
    });

    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  async findAll(query: StudentPaymentQueryDto, companyId: number): Promise<PaginatedResponseDto<StudentPayment>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.schoolYear', 'schoolYear')
      .leftJoinAndSelect('payment.level', 'level')
      .leftJoinAndSelect('payment.levelPricing', 'levelPricing')
      .leftJoinAndSelect('payment.company', 'company')
      .where('payment.status <> :deletedStatus', { deletedStatus: -2 })
      .orderBy('payment.date', 'DESC')
      .addOrderBy('payment.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Always filter by company_id from authenticated user
    qb.andWhere('payment.company_id = :company_id', { company_id: companyId });

    if (query.status !== undefined) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }

    if (query.student_id) {
      qb.andWhere('payment.student_id = :student_id', { student_id: query.student_id });
    }

    if (query.school_year_id) {
      qb.andWhere('payment.school_year_id = :school_year_id', { school_year_id: query.school_year_id });
    }

    if (query.level_id) {
      qb.andWhere('payment.level_id = :level_id', { level_id: query.level_id });
    }

    if (query.level_pricing_id) {
      qb.andWhere('payment.level_pricing_id = :level_pricing_id', { level_pricing_id: query.level_pricing_id });
    }

    if (query.date) {
      qb.andWhere('payment.date = :date', { date: query.date });
    }

    if (query.mode) {
      qb.andWhere('payment.mode = :mode', { mode: query.mode });
    }

    if (query.search) {
      const search = `%${query.search}%`;
      qb.andWhere(
        '(payment.reference LIKE :search OR payment.mode LIKE :search OR student.first_name LIKE :search OR student.last_name LIKE :search)',
        { search },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentPayment> {
    const payment = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['student', 'schoolYear', 'level', 'levelPricing', 'company'],
    });
    if (!payment) {
      throw new NotFoundException('Student payment not found');
    }
    return payment;
  }

  async update(id: number, dto: UpdateStudentPaymentDto, companyId: number): Promise<StudentPayment> {
    const existing = await this.findOne(id, companyId);

    // If student_id is being updated, verify it belongs to the same company
    if (dto.student_id !== undefined) {
      const student = await this.studentRepo.findOne({
        where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${dto.student_id} not found or does not belong to your company`);
      }
    }

    // If school_year_id is being updated, verify it belongs to the same company
    if (dto.school_year_id !== undefined) {
      const schoolYear = await this.schoolYearRepo.findOne({
        where: { id: dto.school_year_id, status: Not(-2) },
        relations: ['company'],
      });
      if (!schoolYear) {
        throw new NotFoundException(`School year with ID ${dto.school_year_id} not found`);
      }
      if (schoolYear.company?.id !== companyId) {
        throw new BadRequestException('School year does not belong to your company');
      }
    }

    // If level_id is being updated, verify it belongs to the same company
    if (dto.level_id !== undefined) {
      const level = await this.levelRepo.findOne({
        where: { id: dto.level_id, company_id: companyId, status: Not(-2) },
      });
      if (!level) {
        throw new NotFoundException(`Level with ID ${dto.level_id} not found or does not belong to your company`);
      }
    }

    // If level_pricing_id is being updated, verify it belongs to the same company
    if (dto.level_pricing_id !== undefined) {
      const levelPricing = await this.levelPricingRepo.findOne({
        where: { id: dto.level_pricing_id, company_id: companyId },
      });
      if (!levelPricing) {
        throw new NotFoundException(`Level pricing with ID ${dto.level_pricing_id} not found or does not belong to your company`);
      }
    }

    // Validate payment doesn't exceed amount
    const paymentAmount = dto.payment !== undefined ? dto.payment : existing.payment;
    const totalAmount = dto.amount !== undefined ? dto.amount : existing.amount;
    this.validatePaymentAmount(paymentAmount, totalAmount);

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;
    
    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    existing.status = -2;
    await this.repo.save(existing);
  }

  private validatePaymentAmount(payment: number, amount: number): void {
    if (payment > amount) {
      throw new BadRequestException('Payment amount cannot exceed the total amount to be paid');
    }
  }
}

