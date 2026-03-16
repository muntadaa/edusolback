import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateRubriqueDto } from './dto/create-rubrique.dto';
import { UpdateRubriqueDto } from './dto/update-rubrique.dto';
import { Rubrique } from './entities/rubrique.entity';

@Injectable()
export class RubriqueService {
  constructor(
    @InjectRepository(Rubrique)
    private readonly repo: Repository<Rubrique>,
  ) {}

  async create(dto: CreateRubriqueDto, companyId: number): Promise<Rubrique> {
    const entity = this.repo.create({
      ...dto,
      company_id: companyId,
      status: dto.status ?? 2,
      occurrences: dto.occurrences ?? 1,
      every_month: dto.every_month ?? 0,
      vat_rate: dto.vat_rate ?? 0,
    });
    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  async findAll(companyId: number): Promise<Rubrique[]> {
    return this.repo.find({
      where: { company_id: companyId, status: Not(-2) },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, companyId: number): Promise<Rubrique> {
    const rubrique = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
    });
    if (!rubrique) {
      throw new NotFoundException('Rubrique not found');
    }
    return rubrique;
  }

  async update(
    id: number,
    dto: UpdateRubriqueDto,
    companyId: number,
  ): Promise<Rubrique> {
    const existing = await this.findOne(id, companyId);

    const dtoWithoutCompany = { ...dto } as any;
    delete dtoWithoutCompany.company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    merged.company_id = companyId;

    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    existing.status = -2;
    await this.repo.save(existing);
  }
}
