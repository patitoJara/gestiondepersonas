import { AffiliateRequest } from './affiliate-request.model';

export interface PostulationResponse {
  id: number;

  code: string;

  periodYear: number;

  userId?: number | null;

  userRut?: string | null;

  userFullName?: string | null;

  stablishmentId?: number | null;

  stablishmentName?: string | null;

  status: string;

  currentStep: number;

  isSingleParentHome?: boolean;

  beneficiaryType?: 'AFFILIATE' | 'FAMILY_MEMBER' | null;

  beneficiaryFamilyMemberId?: number | null;

  affiliate?: AffiliateRequest | null;

  totalFamilyIncome?: number;

  totalBasicExpenses?: number;

  totalEducationExpenses?: number;

  totalOtherExpenses?: number;

  totalHealthExpenses?: number;

  totalFamilyExpenses?: number;

  submittedAt?: string | null;

  createdAt?: string | null;

  updatedAt?: string | null;
}
