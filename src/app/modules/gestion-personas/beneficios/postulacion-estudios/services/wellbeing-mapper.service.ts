import { Injectable } from '@angular/core';

import { AffiliateRequest } from '../models/affiliate-request.model';

import { FamilyMemberRequest } from '../models/family-member-request.model';

import { BeneficiaryRequest } from '../models/beneficiary-request.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingMapperService {
  constructor() {}

  // =========================================
  // 🔥 AFFILIATE
  // =========================================

  mapAffiliate(form: any): AffiliateRequest {
    return {
      rut: form.rut,
      names: `${form.firstName || ''} ${form.secondName || ''}`.trim(),
      lastNames:
        `${form.firstLastName || ''} ${form.secondLastName || ''}`.trim(),
      email: form.email,
      phone: form.telefono,
      birthDate: form.fechaNacimiento,
      gender: form.sexo,
      address: form.direccion,
      affiliateType: form.tipoAfiliado,
      establishment: form.establishment,
      affiliationDate: form.affiliationDate,
    };
  }

  // =========================================
  // 🔥 FAMILY MEMBERS
  // =========================================

  mapFamilyMembers(familiares: any[]): FamilyMemberRequest[] {
    return familiares.map((f) => ({
      rut: f.rut,
      names: f.nombre || '',
      lastNames: '',
      age: f.edad || 0,
      parentTypeId: f.parentTypeId,
      civilStateId: f.civilStateId,
      activityId: f.activityId,
      workplaceId: f.workPlaceId,
      studyId: f.studyId,
      previtionId: f.previtionId,
      contractTypeId: f.contractTypeId,
      studiesInRegion: f.estudiaRegion === 'SI',
      healthInsurance: '',
      incomeType: '',
      income: 0,
      hasDisability: false,
      relationshipType: '',
      civilStatus: '',
      activity: '',
      educationLevel: '',
    }));
  }

  // =========================================
  // 🔥 BENEFICIARY
  // =========================================

  mapBeneficiary(data: any): BeneficiaryRequest {
    return {
      beneficiaryType: data.tipoBeneficiario,

      familyMemberId: data.familiarId || null,
    };
  }
}
