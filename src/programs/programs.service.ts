import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramQueryDto } from './dto/program-query.dto';
import { PaginationService } from '../common/services/pagination.service';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(Program)
    private repo: Repository<Program>,
  ) {}

  async create(dto: CreateProgramDto, companyId: number): Promise<Program> {
    try {
      // Always set company_id from authenticated user
      const dtoWithCompany = {
        ...dto,
        company_id: companyId,
      };
      const created = this.repo.create(dtoWithCompany);
      const saved = await this.repo.save(created);
      return this.findOne(saved.id, companyId);
    } catch {
      throw new BadRequestException('Failed to create program');
    }
  }

  async findAll(query: ProgramQueryDto, companyId: number): Promise<PaginatedResponseDto<Program>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.repo.createQueryBuilder('p').leftJoinAndSelect('p.specializations', 's');
    qb.andWhere('p.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('p.company_id = :company_id', { company_id: companyId });
    if (query.search) qb.andWhere('p.title LIKE :search', { search: `%${query.search}%` });
    if (query.status !== undefined) qb.andWhere('p.status = :status', { status: query.status });
    qb.skip((page - 1) * limit).take(limit).orderBy('p.id', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<Program> {
    const found = await this.repo.findOne({ 
      where: { id, company_id: companyId, status: Not(-2) }, 
      relations: ['specializations'] 
    });
    if (!found) throw new NotFoundException('Program not found');
    return found;
  }

  async update(id: number, dto: UpdateProgramDto, companyId: number): Promise<Program> {
    const existing = await this.findOne(id, companyId);
    
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
    await this.repo.remove(existing);
  }
}
