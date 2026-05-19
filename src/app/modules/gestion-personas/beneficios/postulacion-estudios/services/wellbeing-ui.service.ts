import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingUiService {

  constructor() {}

  // =========================================
  // 🔥 STATUS COLOR
  // =========================================

  statusColor(
    status?: string | null,
  ): string {

    switch (status) {

      case 'BORRADOR':
        return '#64748b';

      case 'EN_REVISION':
        return '#f59e0b';

      case 'APROBADA':
        return '#10b981';

      case 'RECHAZADA':
        return '#ef4444';

      default:
        return '#1565C0';
    }
  }

  // =========================================
  // 🔥 STATUS ICON
  // =========================================

  statusIcon(
    status?: string | null,
  ): string {

    switch (status) {

      case 'BORRADOR':
        return 'edit_note';

      case 'EN_REVISION':
        return 'schedule';

      case 'APROBADA':
        return 'verified';

      case 'RECHAZADA':
        return 'cancel';

      default:
        return 'description';
    }
  }

  // =========================================
  // 🔥 STEP ICON
  // =========================================

  stepIcon(
    step: number,
  ): string {

    switch (step) {

      case 1:
        return 'badge';

      case 2:
        return 'groups';

      case 3:
        return 'person';

      case 4:
        return 'school';

      case 5:
        return 'fact_check';

      case 6:
        return 'payments';

      case 7:
        return 'receipt_long';

      case 8:
        return 'home';

      case 9:
        return 'attach_file';

      case 10:
        return 'assignment';

      case 11:
        return 'verified';

      default:
        return 'radio_button_checked';
    }
  }

  // =========================================
  // 🔥 PROGRESS COLOR
  // =========================================

  progressColor(
    value: number,
  ): string {

    if (value >= 100) {
      return '#10b981';
    }

    if (value >= 70) {
      return '#1565C0';
    }

    if (value >= 40) {
      return '#f59e0b';
    }

    return '#ef4444';
  }
}