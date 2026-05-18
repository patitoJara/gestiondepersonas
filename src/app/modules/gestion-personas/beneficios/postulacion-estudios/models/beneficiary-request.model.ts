export interface BeneficiaryRequest {
  beneficiaryType: 'AFFILIATE' | 'FAMILY_MEMBER';

  /**
   * Backend DTO field: familyMemberId.
   * Debe ser el backendId del integrante familiar, no el id local del frontend.
   */
  familyMemberId?: number | null;
}
