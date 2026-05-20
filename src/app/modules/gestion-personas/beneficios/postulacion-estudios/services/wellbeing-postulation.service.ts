import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, forkJoin } from 'rxjs';

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

import { PostulationSummaryResponse } from '../models/postulation-summary-response.model';

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

  private apiUrl = `${environment.apiUrl}/wellbeing/postulations`;

  constructor() {}

  // =========================================
  // 🔥 MY AFFILIATE
  // =========================================

  saveAffiliate(
    postulationId: number,
    payload: AffiliateRequest,
  ): Observable<PostulationResponse> {
    return this.http.put<PostulationResponse>(
      `${this.apiUrl}/my/${postulationId}/affiliate`,
      payload,
    );
  }

  // =========================================
  // 🔥 RESTORE MY POSTULATION
  // =========================================

  restoreMyPostulation(postulationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/my/${postulationId}/restore`, {});
  }

  // =========================================
  // 🔥 UPDATE CURRENT STEP
  // =========================================

  updateCurrentStep(
    postulationId: number,
    currentStep: number,
  ): Observable<any> {
    const payload = {
      currentStep: Number(currentStep),
    };

    return this.http.patch(`${this.apiUrl}/my/${postulationId}/step`, payload);
  }

  // =========================================
  // 🔥 STEP 2 — FAMILY GROUP
  // =========================================

  updateFamilyGroup(
    postulationId: number,
    payload: { isSingleParentHome: boolean },
  ): Observable<PostulationResponse> {
    return this.http.patch<PostulationResponse>(
      `${this.apiUrl}/my/${postulationId}/family-group`,
      payload,
    );
  }

  // =========================================
  // 🔥 MY DRAFTS
  // =========================================

  getMyDrafts(): Observable<PostulationSummaryResponse[]> {
    return this.http.get<PostulationSummaryResponse[]>(
      `${this.apiUrl}/my-drafts`,
    );
  }

  // =========================================
  // 🔥 STEP 2 — FAMILY MEMBERS
  // =========================================

  saveFamilyMember(
    postulationId: number,
    payload: FamilyMemberRequest,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/my/${postulationId}/family-members`,
      payload,
    );
  }

  updateFamilyMember(
    familyMemberId: number,
    payload: FamilyMemberRequest,
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/my/family-members/${familyMemberId}`,
      payload,
    );
  }

  deleteFamilyMember(familyMemberId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/my/family-members/${familyMemberId}`,
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
      `${this.apiUrl}/my/${postulationId}/beneficiary`,
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
      `${this.apiUrl}/my/${postulationId}/academic-info`,
      payload,
    );
  }

  updateAcademicInfo(postulationId: number, payload: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/my/${postulationId}/academic-info`,
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
      `${this.apiUrl}/my/${postulationId}/academic-verification`,
      payload,
    );
  }

  // =========================================
  // 🔥 STEP 6 — FAMILY INCOMES
  // =========================================

  createIncome(postulationId: number, payload: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/my/${postulationId}/incomes`,
      payload,
    );
  }

  saveFamilyIncomes(
    postulationId: number,
    payload: IncomeRequest[],
  ): Observable<any> {
    return forkJoin(
      payload.map((income) => this.createIncome(postulationId, income)),
    );
  }

  // =========================================
  // 🔥 STEP 7 — FAMILY EXPENSES
  // =========================================

  createExpense(postulationId: number, payload: any): Observable<any> {
    return this.createOtherExpense(postulationId, payload);
  }

  createOtherExpense(postulationId: number, payload: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/my/${postulationId}/other-expenses`,
      payload,
    );
  }

  saveFixedExpenses(postulationId: number, payload: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/my/${postulationId}/fixed-expenses`,
      payload,
    );
  }
  // =========================================
  // 🔥 STEP 8 — HEALTH RECORDS
  // =========================================

  createHealthRecord(
    postulationId: number,
    payload: HealthRecordRequest,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/my/${postulationId}/health-records`,
      payload,
    );
  }

  saveHealthRecords(
    postulationId: number,
    payload: HealthRecordRequest[],
  ): Observable<any> {
    return forkJoin(
      payload.map((record) => this.createHealthRecord(postulationId, record)),
    );
  }

  // =========================================
  // 🔥 STEP 8 — HOUSING
  // =========================================

  saveHousing(postulationId: number, payload: HousingRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/my/${postulationId}/housing`, payload);
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

    formData.append('documentTypeId', documentTypeId.toString());

    formData.append('file', file);

    return this.http.post(
      `${this.apiUrl}/my/${postulationId}/documents`,
      formData,
    );
  }

  createDocument(postulationId: number, payload: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/my/${postulationId}/documents`,
      payload,
    );
  }

  deleteDocument(documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my/documents/${documentId}`);
  }

  // =========================================
  // 🔥 STEP 10 — SUMMARY
  // =========================================

  getSummary(postulationId: number): Observable<SummaryResponse> {
    return this.http.get<SummaryResponse>(
      `${this.apiUrl}/my/${postulationId}/summary`,
    );
  }

  // =========================================
  // 🔥 START DRAFT
  // =========================================

  start(payload: any): Observable<PostulationResponse> {
    return this.http.post<PostulationResponse>(`${this.apiUrl}/start`, payload);
  }

  // =========================================
  // 🔥 MY ACTIVE
  // =========================================

  getMyActive(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-active`);
  }

  // =========================================
  // 🔥 MY POSTULATION
  // =========================================

  getMyPostulation(postulationId: number): Observable<PostulationResponse> {
    return this.http.get<PostulationResponse>(
      `${this.apiUrl}/my/${postulationId}`,
    );
  }

  // =========================================
  // 🔥 MY SUMMARY
  // =========================================

  getMySummary(postulationId: number): Observable<SummaryResponse> {
    return this.http.get<SummaryResponse>(
      `${this.apiUrl}/my/${postulationId}/summary`,
    );
  }

  // =========================================
  // 🔥 DELETE MY POSTULATION
  // =========================================

  deleteMyPostulation(postulationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my/${postulationId}`);
  }

  // =========================================
  // 🔥 SEARCH POSTULATIONS
  // =========================================

  search(params: any): Observable<any> {
    return this.http.get(this.apiUrl, {
      params,
    });
  }

  // =========================================
  // 🔥 GET BY ID
  // =========================================

  getById(postulationId: number): Observable<PostulationResponse> {
    return this.http.get<PostulationResponse>(
      `${this.apiUrl}/${postulationId}`,
    );
  }

  // =========================================
  // 🔥 STEP 6 — DELETE INCOME
  // =========================================

  deleteIncome(incomeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my/incomes/${incomeId}`);
  }

  // =========================================
  // 🔥 STEP 7 — DELETE EXPENSE
  // =========================================

  deleteExpense(expenseId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my/expenses/${expenseId}`);
  }

  // =========================================
  // 🔥 STEP 8 — DELETE HEALTH RECORD
  // =========================================

  deleteHealthRecord(recordId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my/health-records/${recordId}`);
  }
}
