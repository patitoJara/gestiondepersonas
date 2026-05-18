import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingFormatService {

  constructor() {}

  // =========================================
  // 🔥 CURRENCY
  // =========================================

  currency(
    value?: number | null,
  ): string {

    return new Intl.NumberFormat(
      'es-CL',
      {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      },
    ).format(value || 0);
  }

  // =========================================
  // 🔥 PERCENTAGE
  // =========================================

  percentage(
    value?: number | null,
  ): string {

    return `${value || 0}%`;
  }

  // =========================================
  // 🔥 RUT
  // =========================================

  rut(
    value?: string | null,
  ): string {

    if (!value) {
      return '';
    }

    return value;
  }

  // =========================================
  // 🔥 DATE
  // =========================================

  date(
    value?: string | Date | null,
  ): string {

    if (!value) {
      return '';
    }

    return new Date(value)
      .toLocaleDateString('es-CL');
  }

  // =========================================
  // 🔥 FULL NAME
  // =========================================

  fullName(
    ...parts: (string | undefined)[]
  ): string {

    return parts
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  // =========================================
  // 🔥 STATUS
  // =========================================

  status(
    value?: string | null,
  ): string {

    switch (value) {

      case 'BORRADOR':
        return 'Borrador';

      case 'EN_REVISION':
        return 'En revisión';

      case 'APROBADA':
        return 'Aprobada';

      case 'RECHAZADA':
        return 'Rechazada';

      default:
        return value || '-';
    }
  }
}