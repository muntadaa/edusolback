import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequiredDocsService } from '../required-docs/required-docs.service';
import { AuditorDocument } from './entities/auditor-document.entity';
import { AuditorDocumentStatus } from './enums/auditor-document-status.enum';

@Injectable()
export class AuditorDocumentsSyncService {
  private readonly logger = new Logger(AuditorDocumentsSyncService.name);

  constructor(
    @InjectRepository(AuditorDocument)
    private readonly auditorRepo: Repository<AuditorDocument>,
    private readonly requiredDocsService: RequiredDocsService,
  ) {}

  /**
   * Creates one row per matching required-doc template (snapshot). Skips if (student, template) already exists.
   */
  async syncForStudent(
    studentId: number,
    companyId: number,
    programId: number | null | undefined,
    specializationId: number | null | undefined,
    levelId: number | null | undefined,
    classStudentId: number | null,
  ): Promise<void> {
    if (
      programId == null ||
      specializationId == null ||
      levelId == null ||
      programId < 1 ||
      specializationId < 1 ||
      levelId < 1
    ) {
      return;
    }

    let templates: Awaited<ReturnType<RequiredDocsService['findApplicableTemplates']>>;
    try {
      templates = await this.requiredDocsService.findApplicableTemplates(
        companyId,
        programId,
        specializationId,
        levelId,
      );
    } catch (e) {
      this.logger.warn(
        `Required-docs lookup failed for student ${studentId} (${programId}/${specializationId}/${levelId}): ${e}`,
      );
      return;
    }

    for (const t of templates) {
      const exists = await this.auditorRepo.findOne({
        where: { student_id: studentId, required_doc_id: t.id },
      });
      if (exists) {
        continue;
      }
      await this.auditorRepo.save(
        this.auditorRepo.create({
          company_id: companyId,
          student_id: studentId,
          class_student_id: classStudentId,
          required_doc_id: t.id,
          title: t.title,
          is_required_snapshot: t.is_required,
          program_id: programId,
          specialization_id: specializationId,
          level_id: levelId,
          status: AuditorDocumentStatus.PENDING,
          file_path: null,
          verified_by_user_id: null,
          verified_at: null,
        }),
      );
    }
  }
}
