import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

import { PostulationResponse } from '../models/postulation-response.model';

import { AffiliateRequest } from '../models/affiliate-request.model';

import { FamilyMemberRequest } from '../models/family-member-request.model';

import { BeneficiaryRequest } from '../models/beneficiary-request.model';

import { AcademicBackgroundRequest } from '../models/academic-background-request.model';

import { AcademicVerificationRequest } from '../models/academic-verification-request.model';

import { IncomeRequest } from '../models/income-request.model';

import { ExpenseRequest } from '../models/expense-request.model';

import { HealthRecordRequest } from '../models/health-record-request.model';

import { HousingRequest } from '../models/housing-request.model';

import { SummaryResponse } from '../models/summary-response.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingPostulationService {
  // =========================================
  // 🔥 INJECTS
  // =========================================

  private http = inject(HttpClient);

  // =========================================
  // 🔥 BASE URL
  // =========================================

  private apiUrl =
    `${environment.apiUrl}/wellbeing/postulations`;

  constructor() {}

  // =========================================
  // 🔥 CREATE POSTULATION
  // =========================================

  createPostulation(): Observable<PostulationResponse> {
    return this.http.post<PostulationResponse>(
      this.apiUrl,
      {
        processYear: 2026,

        benefitType: 'APOYO_ESTUDIOS_SUPERIORES',
      },
    );
  }

  // =========================================
  // 🔥 STEP 1 — AFFILIATE
  // =========================================

  saveAffiliate(
    postulationId: number,
    payload: AffiliateRequest,
  ): Observable<PostulationResponse> {

    return this.http.put<PostulationResponse>(
      `${this.apiUrl}/${postulationId}/affiliate`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 2 — FAMILY MEMBERS
  // =========================================

  saveFamilyMembers(
    postulationId: number,
    payload: FamilyMemberRequest[],
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${postulationId}/family-members`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 3 — BENEFICIARY
  // =========================================

  saveBeneficiary(
    postulationId: number,
    payload: BeneficiaryRequest,
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${postulationId}/beneficiary`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 4 — ACADEMIC BACKGROUND
  // =========================================

  saveAcademicBackground(
    postulationId: number,
    payload: AcademicBackgroundRequest,
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${postulationId}/academic-background`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 5 — ACADEMIC VERIFICATION
  // =========================================

  saveAcademicVerification(
    postulationId: number,
    payload: AcademicVerificationRequest,
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${postulationId}/academic-verification`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 6 — FAMILY INCOMES
  // =========================================

  saveFamilyIncomes(
    postulationId: number,
    payload: IncomeRequest[],
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${postulationId}/family-incomes`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 7 — FAMILY EXPENSES
  // =========================================

  saveFamilyExpenses(
    postulationId: number,
    payload: ExpenseRequest,
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${postulationId}/family-expenses`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 8 — HEALTH RECORDS
  // =========================================

  saveHealthRecords(
    postulationId: number,
    payload: HealthRecordRequest[],
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${postulationId}/health-records`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 8 — HOUSING
  // =========================================

  saveHousing(
    postulationId: number,
    payload: HousingRequest,
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${postulationId}/housing`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 9 — DOCUMENTS
  // =========================================

  uploadDocument(
    postulationId: number,
    documentTypeId: number,
    file: File,
  ): Observable<any> {

    const formData = new FormData();

    formData.append(
      'documentTypeId',
      documentTypeId.toString(),
    );

    formData.append(
      'file',
      file,
    );

    return this.http.post(
      `${this.apiUrl}/${postulationId}/documents`,
      formData,
    );
  }

  // =========================================
  // 🔥 STEP 10 — SUMMARY
  // =========================================

  getSummary(
    postulationId: number,
  ): Observable<SummaryResponse> {

    return this.http.get<SummaryResponse>(
      `${this.apiUrl}/${postulationId}/summary`,
    );
  }
}