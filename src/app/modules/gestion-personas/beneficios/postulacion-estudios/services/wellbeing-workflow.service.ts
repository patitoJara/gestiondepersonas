import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

import { PostulationResponse } from '../models/postulation-response.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingWorkflowService {

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
  // 🔥 GET POSTULATION
  // =========================================

  getPostulation(
    postulationId: number,
  ): Observable<PostulationResponse> {

    return this.http.get<PostulationResponse>(
      `${this.apiUrl}/${postulationId}`,
    );
  }

  // =========================================
  // 🔥 UPDATE STEP
  // =========================================

  updateCurrentStep(
    postulationId: number,
    currentStep: number,
  ): Observable<any> {

    return this.http.patch(
      `${this.apiUrl}/${postulationId}/step`,
      {
        currentStep,
      },
    );
  }

  // =========================================
  // 🔥 SUBMIT POSTULATION
  // =========================================

  submitPostulation(
    postulationId: number,
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/${postulationId}/submit`,
      {},
    );
  }

  // =========================================
  // 🔥 CANCEL POSTULATION
  // =========================================

  cancelPostulation(
    postulationId: number,
  ): Observable<any> {

    return this.http.patch(
      `${this.apiUrl}/${postulationId}/cancel`,
      {},
    );
  }

  // =========================================
  // 🔥 DELETE DRAFT
  // =========================================

  deleteDraft(
    postulationId: number,
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${postulationId}`,
    );
  }
}