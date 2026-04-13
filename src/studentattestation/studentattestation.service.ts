import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateStudentAttestationDto } from './dto/create-studentattestation.dto';
import { UpdateStudentAttestationDto } from './dto/update-studentattestation.dto';
import { StudentAttestationQueryDto } from './dto/studentattestation-query.dto';
import { StudentAttestation } from './entities/studentattestation.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Student } from '../students/entities/student.entity';
import { Attestation } from '../attestation/entities/attestation.entity';
import { Company } from '../company/entities/company.entity';

@Injectable()
export class StudentattestationService {
  constructor(
    @InjectRepository(StudentAttestation)
    private readonly studentAttestationRepository: Repository<StudentAttestation>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Attestation)
    private readonly attestationRepository: Repository<Attestation>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createStudentAttestationDto: CreateStudentAttestationDto, companyId: number): Promise<StudentAttestation> {
    // Validate student exists, is not deleted, and belongs to the same company
    const student = await this.studentRepository.findOne({
      where: { id: createStudentAttestationDto.Idstudent, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${createStudentAttestationDto.Idstudent} not found or does not belong to your company`);
    }

    // Validate attestation exists, is not deleted, and belongs to the same company
    const attestation = await this.attestationRepository.findOne({
      where: { id: createStudentAttestationDto.Idattestation, companyid: companyId, statut: Not(-2) },
    });
    if (!attestation) {
      throw new NotFoundException(`Attestation with ID ${createStudentAttestationDto.Idattestation} not found or does not belong to your company`);
    }

    // Validate dateask is before datedelivery
    this.validateDateRange(createStudentAttestationDto.dateask, createStudentAttestationDto.datedelivery);

    // Always set companyid from authenticated user
    const studentAttestation = this.studentAttestationRepository.create({
      Idstudent: createStudentAttestationDto.Idstudent,
      Idattestation: createStudentAttestationDto.Idattestation,
      dateask: createStudentAttestationDto.dateask ?? null,
      datedelivery: createStudentAttestationDto.datedelivery ?? null,
      description: createStudentAttestationDto.description ?? null,
      Status: createStudentAttestationDto.Status ?? 1,
      companyid: companyId,
    });

    const saved = await this.studentAttestationRepository.save(studentAttestation);
    return this.findOne(saved.id, companyId);
  }

  async findAll(queryDto: StudentAttestationQueryDto, companyId: number): Promise<PaginatedResponseDto<StudentAttestation>> {
    const { page = 1, limit = 10, search, Status, Idstudent, Idattestation } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.studentAttestationRepository
      .createQueryBuilder('studentAttestation')
      .leftJoinAndSelect('studentAttestation.student', 'student')
      .leftJoinAndSelect('studentAttestation.attestation', 'attestation')
      .leftJoinAndSelect('studentAttestation.company', 'company')
      .skip(skip)
      .take(limit)
      .orderBy('studentAttestation.created_at', 'DESC');

    // Exclude soft-deleted records (Status = -2)
    queryBuilder.andWhere('studentAttestation.Status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by companyid from authenticated user
    queryBuilder.andWhere('studentAttestation.companyid = :companyid', { companyid: companyId });

    // Add search filter for student name or attestation title
    if (search) {
      queryBuilder.andWhere(
        '(student.first_name LIKE :search OR student.last_name LIKE :search OR student.email LIKE :search OR attestation.title LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Add status filter
    if (Status !== undefined) {
      queryBuilder.andWhere('studentAttestation.Status = :Status', { Status });
    }

    // Add student filter
    if (Idstudent !== undefined) {
      queryBuilder.andWhere('studentAttestation.Idstudent = :Idstudent', { Idstudent });
    }

    // Add attestation filter
    if (Idattestation !== undefined) {
      queryBuilder.andWhere('studentAttestation.Idattestation = :Idattestation', { Idattestation });
    }

    const [studentAttestations, total] = await queryBuilder.getManyAndCount();

    return PaginationService.createResponse(studentAttestations, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentAttestation> {
    const studentAttestation = await this.studentAttestationRepository.findOne({
      where: { id, companyid: companyId, Status: Not(-2) },
      relations: ['student', 'attestation', 'company'],
    });

    if (!studentAttestation) {
      throw new NotFoundException(`StudentAttestation with ID ${id} not found`);
    }

    return studentAttestation;
  }

  async update(id: number, updateStudentAttestationDto: UpdateStudentAttestationDto, companyId: number): Promise<StudentAttestation> {
    const studentAttestation = await this.findOne(id, companyId);

    // Validate student if provided
    if (updateStudentAttestationDto.Idstudent) {
      const student = await this.studentRepository.findOne({
        where: { id: updateStudentAttestationDto.Idstudent, company_id: companyId, status: Not(-2) },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${updateStudentAttestationDto.Idstudent} not found or does not belong to your company`);
      }
    }

    // Validate attestation if provided
    if (updateStudentAttestationDto.Idattestation) {
      const attestation = await this.attestationRepository.findOne({
        where: { id: updateStudentAttestationDto.Idattestation, companyid: companyId, statut: Not(-2) },
      });
      if (!attestation) {
        throw new NotFoundException(`Attestation with ID ${updateStudentAttestationDto.Idattestation} not found or does not belong to your company`);
      }
    }

    // Validate dateask is before datedelivery (check both new values and existing values)
    const finalDateAsk = updateStudentAttestationDto.dateask ?? studentAttestation.dateask;
    const finalDateDelivery = updateStudentAttestationDto.datedelivery ?? studentAttestation.datedelivery;
    this.validateDateRange(finalDateAsk, finalDateDelivery);

    // Prevent changing companyid - always use authenticated user's company
    const dtoWithoutCompany = { ...updateStudentAttestationDto };
    delete (dtoWithoutCompany as any).companyid;

    Object.assign(studentAttestation, dtoWithoutCompany);
    // Ensure companyid remains from authenticated user
    studentAttestation.companyid = companyId;
    studentAttestation.company = { id: companyId } as any;

    // If a delivery date is set, automatically mark status as active (1)
    if (studentAttestation.datedelivery) {
      studentAttestation.Status = 1;
    }
    const savedStudentAttestation = await this.studentAttestationRepository.save(studentAttestation);

    return this.findOne(savedStudentAttestation.id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    // Soft delete: set Status to -2
    existing.Status = -2;
    await this.studentAttestationRepository.save(existing);
  }

  private validateDateRange(dateask: string | null | undefined, datedelivery: string | null | undefined): void {
    // If both dates are provided, validate that datedelivery is the same day or after dateask
    if (dateask && datedelivery) {
      const askDate = new Date(dateask);
      const deliveryDate = new Date(datedelivery);

      if (isNaN(askDate.getTime()) || isNaN(deliveryDate.getTime())) {
        throw new BadRequestException('Invalid dateask or datedelivery format');
      }

      if (deliveryDate < askDate) {
        throw new BadRequestException('datedelivery must be greater than or equal to dateask');
      }
    }
  }
}
