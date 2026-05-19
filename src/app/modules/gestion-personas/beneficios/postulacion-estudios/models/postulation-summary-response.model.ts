export interface PostulationSummaryResponse {

  id: number;

  code: string;

  status: string;

  createdAt: string;

  updatedAt: string;

  currentStep?: number;

  benefitType?: string;
}