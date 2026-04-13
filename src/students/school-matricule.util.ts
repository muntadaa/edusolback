import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Student } from './entities/student.entity';

const MATRICULE_SEQ_LEN = 5;

/**
 * Next school matricule: YYYY + 5-digit sequence (e.g. 202600001). Per company, per calendar join-year.
 * Uses MySQL GET_LOCK inside the surrounding transaction for safe concurrency.
 */
export async function allocateNextMatriculeEcole(
  manager: EntityManager,
  companyId: number,
  year: number,
): Promise<string> {
  const yearStr = String(year);
  if (!/^\d{4}$/.test(yearStr)) {
    throw new BadRequestException('Invalid year for school matricule');
  }

  const lockName = `edusol_matricule_ecole_${companyId}_${yearStr}`;
  const lockRows = await manager.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
  const acquired = Number(lockRows?.[0]?.acquired) === 1;
  if (!acquired) {
    throw new BadRequestException('Could not allocate school matricule; try again');
  }

  try {
    const likePattern = `${yearStr}${'_'.repeat(MATRICULE_SEQ_LEN)}`;
    const raw = await manager
      .createQueryBuilder(Student, 's')
      .select('MAX(CAST(SUBSTRING(s.matricule_ecole, 5) AS UNSIGNED))', 'maxSeq')
      .where('s.company_id = :companyId', { companyId })
      .andWhere('s.matricule_ecole LIKE :likePattern', { likePattern })
      .getRawOne<{ maxSeq: string | null }>();

    const maxSeq = raw?.maxSeq != null && raw.maxSeq !== '' ? Number(raw.maxSeq) : 0;
    if (Number.isNaN(maxSeq)) {
      throw new BadRequestException('Failed to read school matricule sequence');
    }
    const next = maxSeq + 1;
    const maxVal = 10 ** MATRICULE_SEQ_LEN - 1;
    if (next > maxVal) {
      throw new BadRequestException(`School matricule sequence exhausted for year ${yearStr}`);
    }

    return `${yearStr}${String(next).padStart(MATRICULE_SEQ_LEN, '0')}`;
  } finally {
    await manager.query('SELECT RELEASE_LOCK(?)', [lockName]);
  }
}

export function schoolYearStartCalendarYear(startDate: Date | string): number {
  if (startDate instanceof Date) {
    return startDate.getFullYear();
  }
  const s = String(startDate);
  const y = parseInt(s.slice(0, 4), 10);
  if (Number.isNaN(y)) {
    throw new BadRequestException('Invalid school year start_date');
  }
  return y;
}
