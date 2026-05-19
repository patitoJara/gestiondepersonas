import { Injectable } from '@angular/core';

import { SummaryResponse } from '../models/summary-response.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingSummaryService {

  constructor() {}

  // =========================================
  // 🔥 DOCUMENT PROGRESS
  // =========================================

  documentProgress(
    summary?: SummaryResponse | null,
  ): number {

    if (!summary) {
      return 0;
    }

    if (
      !summary.requiredDocumentsTotal
    ) {
      return 0;
    }

    return Math.round(
      (
        summary.requiredDocumentsUploaded /
        summary.requiredDocumentsTotal
      ) * 100,
    );
  }

  // =========================================
  // 🔥 FAMILY BALANCE
  // =========================================

  familyBalance(
    summary?: SummaryResponse | null,
  ): number {

    if (!summary) {
      return 0;
    }

    return (
      summary.totalIncome -
      summary.totalExpenses
    );
  }

  // =========================================
  // 🔥 IS COMPLETE
  // =========================================

  isComplete(
    summary?: SummaryResponse | null,
  ): boolean {

    if (!summary) {
      return false;
    }

    return (
      summary.requiredDocumentsUploaded >=
      summary.requiredDocumentsTotal
    );
  }

  // =========================================
  // 🔥 STATUS LABEL
  // =========================================

  statusLabel(
    summary?: SummaryResponse | null,
  ): string {

    if (!summary) {
      return '-';
    }

    switch (summary.status) {

      case 'BORRADOR':
        return 'Borrador';

      case 'EN_REVISION':
        return 'En revisión';

      case 'APROBADA':
        return 'Aprobada';

      case 'RECHAZADA':
        return 'Rechazada';

      default:
        return summary.status;
    }
  }

  // =========================================
  // 🔥 HAS DEFICIT
  // =========================================

  hasDeficit(
    summary?: SummaryResponse | null,
  ): boolean {

    return (
      this.familyBalance(summary) < 0
    );
  }
}