import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as path from 'path';
import { AuditorDocument } from './entities/auditor-document.entity';
import { Student } from '../students/entities/student.entity';
import { AuditorDocumentStatus } from './enums/auditor-document-status.enum';
import { AuditorDocumentsQueryDto } from './dto/auditor-documents-query.dto';
import { SyncAuditorDocumentsDto } from './dto/sync-auditor-documents.dto';
import { AuditorDocumentsSyncService } from './auditor-documents-sync.service';

@Injectable()
export class AuditorDocumentsService {
  constructor(
    @InjectRepository(AuditorDocument)
    private readonly repo: Repository<AuditorDocument>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly syncService: AuditorDocumentsSyncService,
  ) {}

  private async assertStudentInCompany(studentId: number, companyId: number): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }
    return student;
  }

  async findAllForStudent(companyId: number, q: AuditorDocumentsQueryDto): Promise<AuditorDocument[]> {
    await this.assertStudentInCompany(q.student_id, companyId);
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.company_id = :companyId', { companyId })
      .andWhere('a.student_id = :studentId', { studentId: q.student_id })
      .orderBy('a.is_required_snapshot', 'DESC')
      .addOrderBy('a.title', 'ASC')
      .addOrderBy('a.id', 'ASC');
    if (q.status != null) {
      qb.andWhere('a.status = :status', { status: q.status });
    }
    return qb.getMany();
  }

  async findOne(id: number, companyId: number): Promise<AuditorDocument> {
    const row = await this.repo.findOne({
      where: { id, company_id: companyId },
    });
    if (!row) {
      throw new NotFoundException(`Auditor document ${id} not found`);
    }
    await this.assertStudentInCompany(row.student_id, companyId);
    return row;
  }

  async verify(id: number, companyId: number, userId: number): Promise<AuditorDocument> {
    const row = await this.findOne(id, companyId);
    if (row.status === AuditorDocumentStatus.VERIFIED) {
      return row;
    }
    row.status = AuditorDocumentStatus.VERIFIED;
    row.verified_by_user_id = userId;
    row.verified_at = new Date();
    return this.repo.save(row);
  }

  async unverify(id: number, companyId: number): Promise<AuditorDocument> {
    const row = await this.findOne(id, companyId);
    row.verified_by_user_id = null;
    row.verified_at = null;
    row.status = row.file_path
      ? AuditorDocumentStatus.UPLOADED
      : AuditorDocumentStatus.PENDING;
    return this.repo.save(row);
  }

  async attachFile(id: number, companyId: number, filePath: string): Promise<AuditorDocument> {
    const row = await this.findOne(id, companyId);
    if (row.status === AuditorDocumentStatus.VERIFIED) {
      throw new ForbiddenException('Unverify this document before replacing the file');
    }
    row.file_path = filePath;
    row.status = AuditorDocumentStatus.UPLOADED;
    return this.repo.save(row);
  }

  async manualSync(companyId: number, dto: SyncAuditorDocumentsDto): Promise<{ created: number }> {
    await this.assertStudentInCompany(dto.student_id, companyId);
    const before = await this.repo.count({
      where: { student_id: dto.student_id, company_id: companyId },
    });
    await this.syncService.syncForStudent(
      dto.student_id,
      companyId,
      dto.program_id,
      dto.specialization_id,
      dto.level_id,
      null,
    );
    const after = await this.repo.count({
      where: { student_id: dto.student_id, company_id: companyId },
    });
    return { created: after - before };
  }

  buildPublicFilePath(companyId: number, basename: string): string {
    const relative = path.posix.join('uploads', 'auditor', String(companyId), basename);
    return `/${relative.replace(/\\/g, '/')}`;
  }
}
