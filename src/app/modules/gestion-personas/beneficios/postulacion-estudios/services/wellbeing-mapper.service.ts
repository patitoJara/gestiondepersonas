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
  // 🔥 FORMAT DATE
  // =========================================

  private formatDate(date: any): string | null {
    if (!date) {
      return null;
    }

    return new Date(date).toISOString().split('T')[0];
  }

  // =========================================
  // 🔥 AFFILIATE
  // =========================================

  mapAffiliate(form: any): AffiliateRequest {
    return {
      rut: form.rut || '',

      names: form.nombre || '',

      lastNames: form.apellido || '',

      email: form.email || '',

      phone: form.telefono || '',

      birthDate: this.formatDate(form.fechaNacimiento),

      sex: form.sexo || '',

      address: form.direccion || '',

      affiliateType: form.tipoAfiliado || '',

      stablishmentId: form.establecimiento || null,

      affiliateDate: this.formatDate(form.fechaAfiliacion),
    };
  }

  // =========================================
  // 🔥 FAMILY MEMBERS
  // =========================================

  mapFamilyMembers(familiares: any[]): FamilyMemberRequest[] {
    return familiares.map((f) => ({
      rut: f.rut || '',

      names: f.nombre || '',

      lastNames: f.apellido || '',

      parentTypeId: f.parentTypeId || null,

      civilStateId: f.civilStateId || null,

      activityId: f.activityId || null,

      workPlaceId: f.workPlaceId || null,

      studyLevelId: f.studyId || null,

      previtionId: f.previtionId || null,

      incomeTypeId: f.contractTypeId || null,

      monthlyIncome: f.ingresoMensual || 0,

      student: f.esEstudiante || false,

      studyPlace: f.lugarEstudio || '',

      // =====================================
      // 🔥 LEGACY DTO
      // =====================================

      healthInsurance: '',

      incomeType: '',

      relationshipType: '',

      civilStatus: '',

      activity: '',

      educationLevel: '',
    }));
  }

  // =========================================
  // 🔥 FAMILY MEMBER
  // =========================================

  mapFamilyMember(f: any): FamilyMemberRequest {
    return {
      rut: f.rut || '',

      names: f.nombre || '',

      lastNames: f.apellido || '',

      birthDate: this.formatDate(f.birthDate),

      parentTypeId: f.parentTypeId || null,

      civilStateId: f.civilStateId || null,

      activityId: f.activityId || null,

      workPlaceId: f.workPlaceId || null,

      studyLevelId: f.studyId || null,

      previtionId: f.previtionId || null,

      incomeTypeId: f.contractTypeId || null,

      monthlyIncome: f.ingresoMensual || 0,

      student: f.esEstudiante || false,

      studyPlace: f.lugarEstudio || '',

    };
  }

  // =========================================
  // 🔥 BENEFICIARY
  // =========================================

  mapBeneficiary(data: any): BeneficiaryRequest {
    return {
      beneficiaryType: data.tipoBeneficiario,

      familyMemberId: data.familyMemberId || data.familiarId || null,
    };
  }
}
