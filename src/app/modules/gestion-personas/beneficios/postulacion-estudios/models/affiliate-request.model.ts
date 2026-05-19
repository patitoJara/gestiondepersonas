export interface AffiliateRequest {
  rut: string;

  names: string;

  lastNames: string;

  phone: string;

  email: string;

  birthDate: string | null;

  sex: string;

  address: string;

  affiliateType: string;

  stablishmentId: number | null;

  affiliateDate: string | null;
}