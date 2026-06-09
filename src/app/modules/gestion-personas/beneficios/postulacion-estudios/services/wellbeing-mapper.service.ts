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

    // =====================================
    // 🔥 SI YA VIENE yyyy-MM-dd
    // NO CONVERTIR A UTC
    // =====================================

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // =====================================
    // 🔥 SI VIENE CON HORA
    // TOMAR SOLO LA PARTE DE FECHA
    // =====================================

    if (typeof date === 'string' && date.includes('T')) {
      const dateOnly = date.split('T')[0];

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        return dateOnly;
      }
    }

    // =====================================
    // 🔥 SI VIENE COMO DATE
    // USAR COMPONENTES LOCALES
    // =====================================

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    const year = parsedDate.getFullYear();

    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');

    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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

      birthDate: this.formatDate(f.birthDate),

      parentTypeId: f.parentTypeId || null,

      civilStateId: f.civilStateId || null,

      activityId: f.activityId || null,

      // 🔥 NUEVO CAMPO ACTIVIDAD "OTRO"
      othersActivities: f.othersActivities
        ? String(f.othersActivities).trim()
        : null,

      workPlaceId: f.workPlaceId || null,

      // 🔥 NUEVO CAMPO PROFESIÓN / OFICIO "OTRO"
      othersWorkplaces: f.othersWorkplaces
        ? String(f.othersWorkplaces).trim()
        : null,

      studyLevelId: f.studyId || null,

      previtionId: f.previtionId || null,

      incomeTypeId: f.contractTypeId || null,

      monthlyIncome: f.ingresoMensual || 0,

      student: f.esEstudiante || false,

      studyPlace: f.studyPlace || f.lugarEstudio || '',

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

      // 🔥 NUEVO CAMPO ACTIVIDAD "OTRO"
      othersActivities: f.othersActivities
        ? String(f.othersActivities).trim()
        : null,

      workPlaceId: f.workPlaceId || null,

      // 🔥 NUEVO CAMPO PROFESIÓN / OFICIO "OTRO"
      othersWorkplaces: f.othersWorkplaces
        ? String(f.othersWorkplaces).trim()
        : null,

      studyLevelId: f.studyId || null,

      previtionId: f.previtionId || null,

      incomeTypeId: f.contractTypeId || null,

      monthlyIncome: f.ingresoMensual || 0,

      student: f.esEstudiante || false,

      studyPlace: f.studyPlace || f.lugarEstudio || '',
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
