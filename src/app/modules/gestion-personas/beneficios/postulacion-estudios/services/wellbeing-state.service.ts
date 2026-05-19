import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { SummaryResponse } from '../models/summary-response.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingStateService {

  // =========================================
  // 🔥 CURRENT STEP
  // =========================================

  currentStep$ =
    new BehaviorSubject<number>(1);

  // =========================================
  // 🔥 LOADING
  // =========================================

  loading$ =
    new BehaviorSubject<boolean>(false);

  // =========================================
  // 🔥 POSTULATION ID
  // =========================================

  postulationId$ =
    new BehaviorSubject<number | null>(null);

  // =========================================
  // 🔥 SUMMARY
  // =========================================

  summary$ =
    new BehaviorSubject<SummaryResponse | null>(
      null,
    );

  constructor() {}

  // =========================================
  // 🔥 STEP
  // =========================================

  setCurrentStep(
    step: number,
  ): void {

    this.currentStep$.next(step);
  }

  // =========================================
  // 🔥 LOADING
  // =========================================

  setLoading(
    value: boolean,
  ): void {

    this.loading$.next(value);
  }

  // =========================================
  // 🔥 POSTULATION ID
  // =========================================

  setPostulationId(
    id: number | null,
  ): void {

    this.postulationId$.next(id);
  }

  // =========================================
  // 🔥 SUMMARY
  // =========================================

  setSummary(
    summary: SummaryResponse | null,
  ): void {

    this.summary$.next(summary);
  }

  // =========================================
  // 🔥 RESET
  // =========================================

  reset(): void {

    this.currentStep$.next(1);

    this.loading$.next(false);

    this.postulationId$.next(null);

    this.summary$.next(null);
  }
}