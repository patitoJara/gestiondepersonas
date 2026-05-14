export interface BeneficiaryRequest {
  beneficiaryType: 'AFFILIATE' | 'FAMILY_MEMBER';

  familyMemberId?: number | null;
}