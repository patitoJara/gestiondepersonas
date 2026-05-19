export interface IncomeRequest {
  familyMemberId?: number | null;

  /** Backend DTO field. Actualmente apunta al catálogo usado como tipo de ingreso. */
  incomeTypeId?: number | null;

  amount: number;
}
