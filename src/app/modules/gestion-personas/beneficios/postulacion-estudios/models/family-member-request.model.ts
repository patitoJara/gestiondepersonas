export interface FamilyMemberRequest {
  rut: string;

  names: string;

  lastNames: string;

  birthDate?: string | null;

  parentTypeId?: number | null;

  civilStateId?: number | null;

  activityId?: number | null;

  workPlaceId?: number | null;

  studyLevelId?: number | null;

  previtionId?: number | null;

  incomeTypeId?: number | null;

  monthlyIncome?: number;

  student?: boolean;

  studyPlace?: string;
}
