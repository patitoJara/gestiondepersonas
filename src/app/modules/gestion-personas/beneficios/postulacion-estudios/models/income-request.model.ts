export interface IncomeRequest {
  familyMemberId?: number | null;

  relationshipType: string;

  amount: number;
}