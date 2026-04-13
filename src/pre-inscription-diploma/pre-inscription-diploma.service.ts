import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreatePreInscriptionDiplomaDto } from './dto/create-pre-inscription-diploma.dto';
import { UpdatePreInscriptionDiplomaDto } from './dto/update-pre-inscription-diploma.dto';
import { PreInscriptionDiploma } from './entities/pre-inscription-diploma.entity';
import { PreInscription } from '../preinscriptions/entities/preinscription.entity';

@Injectable()
export class PreInscriptionDiplomaService {
  constructor(
    @InjectRepository(PreInscriptionDiploma)
    private readonly repo: Repository<PreInscriptionDiploma>,
    @InjectRepository(PreInscription)
    private readonly preRepo: Repository<PreInscription>,
  ) {}

  private async ensurePreinscription(
    preInscriptionId: number,
    companyId: number,
  ): Promise<PreInscription> {
    const pre = await this.preRepo.findOne({
      where: { id: preInscriptionId, company_id: companyId },
    });
    if (!pre) {
      throw new NotFoundException(
        `Pre-inscription with id ${preInscriptionId} not found or does not belong to your company`,
      );
    }
    return pre;
  }

  async addDiploma(
    preInscriptionId: number,
    dto: CreatePreInscriptionDiplomaDto,
    companyId: number,
  ) {
    await this.ensurePreinscription(preInscriptionId, companyId);

    const diploma = this.repo.create({
      title: dto.title ?? dto.diploma_name,
      school: dto.school ?? dto.institution,
      diplome: dto.diplome ?? dto.title ?? dto.diploma_name,
      annee: dto.annee ?? dto.year ?? null,
      country: dto.country ?? null,
      city: dto.city ?? null,
      diplome_picture_1: dto.diplome_picture_1 ?? null,
      diplome_picture_2: dto.diplome_picture_2 ?? null,
      preinscription_id: preInscriptionId,
      company_id: companyId,
      status: dto.status ?? 1,
    });
    const saved = await this.repo.save(diploma);
    return this.findOne(saved.id, companyId);
  }

  async getDiplomas(preInscriptionId: number, companyId: number) {
    await this.ensurePreinscription(preInscriptionId, companyId);

    return this.repo.find({
      where: {
        preinscription_id: preInscriptionId,
        company_id: companyId,
        status: Not(-2),
      },
      order: { id: 'DESC' },
    });
  }

  create(dto: CreatePreInscriptionDiplomaDto, companyId: number) {
    return this.addDiploma(dto.preinscription_id, dto, companyId);
  }

  findAll(companyId: number, preinscriptionId?: number) {
    const where: any = { company_id: companyId, status: Not(-2) };
    if (preinscriptionId) {
      where.preinscription_id = preinscriptionId;
    }
    return this.repo.find({
      where,
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, companyId: number) {
    const found = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
    });
    if (!found) {
      throw new NotFoundException('Pre-inscription diploma not found');
    }
    return found;
  }

  async update(
    id: number,
    dto: UpdatePreInscriptionDiplomaDto,
    companyId: number,
  ) {
    const existing = await this.findOne(id, companyId);

    if (dto.preinscription_id !== undefined) {
      await this.ensurePreinscription(dto.preinscription_id, companyId);
    }

    const dtoWithoutCompany = { ...dto } as any;
    delete dtoWithoutCompany.company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    merged.company_id = companyId;
    merged.title = dto.title ?? dto.diploma_name ?? merged.title;
    merged.school = dto.school ?? dto.institution ?? merged.school;
    merged.diplome = dto.diplome ?? dto.title ?? dto.diploma_name ?? merged.diplome;
    merged.annee = dto.annee ?? dto.year ?? merged.annee;

    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number) {
    const existing = await this.findOne(id, companyId);
    existing.status = -2;
    await this.repo.save(existing);
  }

  async removeDiploma(diplomaId: number, companyId: number) {
    await this.remove(diplomaId, companyId);
    return { deleted: true };
  }
}
