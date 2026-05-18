import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

import { Study } from '@app/core/models/study.model';

import { Stablishment } from '@app/core/models/stablishment.model';

import { Prevition } from '@app/core/models/prevition.model';

import { ParentType } from '@app/core/models/parent-type.model';

import { ContractType } from '@app/core/models/contract-type.model';

import { CivilState } from '@app/core/models/civil-state.model';

import { BillType } from '@app/core/models/bill-type.model';

import { Activity } from '@app/core/models/activity.model';

import { WorkPlace } from '@app/core/models/work-place.model';

import { Grade } from '@app/core/models/grade.model';

import { TypeProperty } from '@app/core/models/type-property.model';

import { TypeHousing } from '@app/core/models/type-housing.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingCatalogsService {
  // =========================================
  // 🔥 INJECTS
  // =========================================

  private http = inject(HttpClient);

  // =========================================
  // 🔥 BASE URL
  // =========================================

  private apiUrl =
    `${environment.apiUrl}`;

  constructor() {}

  // =========================================
  // 🔥 STUDIES
  // =========================================

  getStudies(): Observable<Study[]> {
    return this.http.get<Study[]>(
      `${this.apiUrl}/studies/all`,
    );
  }

  // =========================================
  // 🔥 STABLISHMENTS
  // =========================================

  getStablishments(): Observable<Stablishment[]> {
    return this.http.get<Stablishment[]>(
      `${this.apiUrl}/stablishments/all`,
    );
  }

  // =========================================
  // 🔥 PREVITIONS
  // =========================================

  getPrevitions(): Observable<Prevition[]> {
    return this.http.get<Prevition[]>(
      `${this.apiUrl}/previtions/all`,
    );
  }

  // =========================================
  // 🔥 PARENT TYPES
  // =========================================

  getParentTypes(): Observable<ParentType[]> {
    return this.http.get<ParentType[]>(
      `${this.apiUrl}/parents_types/all`,
    );
  }

  // =========================================
  // 🔥 CONTRACT TYPES  /api/v1/contracts_types
  // =========================================

  getContractTypes(): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(
      `${this.apiUrl}/contracts_types/all`,
    );
  }

  // =========================================
  // 🔥 CIVIL STATES /api/v1/civil_states
  // =========================================

  getCivilStates(): Observable<CivilState[]> {
    return this.http.get<CivilState[]>(
      `${this.apiUrl}/civil_states/all`,
    );
  }

  // =========================================
  // 🔥 BILL TYPES   /api/v1/bills_types
  // =========================================

  getBillTypes(): Observable<BillType[]> {
    return this.http.get<BillType[]>(
      `${this.apiUrl}/bills_types/all`,
    );
  }

  // =========================================
  // 🔥 ACTIVITIES
  // =========================================

  getActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(
      `${this.apiUrl}/activities/all`,
    );
  }

  // =========================================
  // 🔥 WORK PLACES /api/v1/works_places/{id}/restore
  // =========================================

  getWorkPlaces(): Observable<WorkPlace[]> {
    return this.http.get<WorkPlace[]>(
      `${this.apiUrl}/works_places/all`,
    );
  }

  // =========================================
  // 🔥 GRADES
  // =========================================

  getGrades(): Observable<Grade[]> {
    return this.http.get<Grade[]>(
      `${this.apiUrl}/grades/all`,
    );
  }

  // =========================================
  // 🔥 TYPE PROPERTY  /api/v1/types_properties
  // =========================================

  getTypeProperties(): Observable<TypeProperty[]> {
    return this.http.get<TypeProperty[]>(
      `${this.apiUrl}/types_properties/all`,
    );
  }

  // =========================================
  // 🔥 TYPE HOUSING /api/v1/types_housings
  // =========================================

  getTypeHousings(): Observable<TypeHousing[]> {
    return this.http.get<TypeHousing[]>(
      `${this.apiUrl}/types_housings/all`,
    );
  }
}