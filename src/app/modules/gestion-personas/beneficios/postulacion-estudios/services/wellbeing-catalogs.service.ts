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
      `${this.apiUrl}/parent-types/all`,
    );
  }

  // =========================================
  // 🔥 CONTRACT TYPES
  // =========================================

  getContractTypes(): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(
      `${this.apiUrl}/contract-types/all`,
    );
  }

  // =========================================
  // 🔥 CIVIL STATES
  // =========================================

  getCivilStates(): Observable<CivilState[]> {
    return this.http.get<CivilState[]>(
      `${this.apiUrl}/civil-states/all`,
    );
  }

  // =========================================
  // 🔥 BILL TYPES
  // =========================================

  getBillTypes(): Observable<BillType[]> {
    return this.http.get<BillType[]>(
      `${this.apiUrl}/bill-types/all`,
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
  // 🔥 WORK PLACES
  // =========================================

  getWorkPlaces(): Observable<WorkPlace[]> {
    return this.http.get<WorkPlace[]>(
      `${this.apiUrl}/work-places/all`,
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
  // 🔥 TYPE PROPERTY
  // =========================================

  getTypeProperties(): Observable<TypeProperty[]> {
    return this.http.get<TypeProperty[]>(
      `${this.apiUrl}/type-properties/all`,
    );
  }

  // =========================================
  // 🔥 TYPE HOUSING
  // =========================================

  getTypeHousings(): Observable<TypeHousing[]> {
    return this.http.get<TypeHousing[]>(
      `${this.apiUrl}/type-housings/all`,
    );
  }
}