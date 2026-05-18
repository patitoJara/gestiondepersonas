export interface Postulation {
  id: number;

  code: string;

  periodYear: number;

  status: string;

  currentStep: number;

  isSingleParentHome?: boolean;
}
