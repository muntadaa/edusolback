import { PreInscriptionStatus } from '../enums/preinscription-status.enum';

const allowedTransitions: Record<PreInscriptionStatus, ReadonlySet<PreInscriptionStatus>> = {
  [PreInscriptionStatus.NEW]: new Set([PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL]),
  [PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL]: new Set([PreInscriptionStatus.COMMERCIAL_REVIEW]),
  [PreInscriptionStatus.COMMERCIAL_REVIEW]: new Set([PreInscriptionStatus.SENT_TO_ADMIN]),
  [PreInscriptionStatus.SENT_TO_ADMIN]: new Set([
    PreInscriptionStatus.APPROVED,
    PreInscriptionStatus.REJECTED,
  ]),
  [PreInscriptionStatus.APPROVED]: new Set([PreInscriptionStatus.CONVERTED]),
  [PreInscriptionStatus.REJECTED]: new Set([]),
  [PreInscriptionStatus.CONVERTED]: new Set([]),
};

export function canTransition(from: PreInscriptionStatus, to: PreInscriptionStatus): boolean {
  return allowedTransitions[from]?.has(to) ?? false;
}

