export interface FamilyMemberRequest {
  rut: string;

  names: string;

  lastNames: string;

  healthInsurance: string;

  incomeType: string;

  relationshipType: string;

  civilStatus: string;

  activity: string;

  workplace?: string | null;

  educationLevel: string;

  studyPlace?: string | null;
}