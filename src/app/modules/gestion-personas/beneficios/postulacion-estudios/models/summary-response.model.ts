export interface SummaryResponse {
  id: number;

  code: string;

  status: string;

  affiliateName: string;

  affiliateRut: string;

  beneficiaryName: string;

  beneficiaryType: string;

  familyMembersCount: number;

  totalIncome: number;

  totalExpenses: number;

  totalHealthExpenses: number;

  requiredDocumentsUploaded: number;

  requiredDocumentsTotal: number;
}