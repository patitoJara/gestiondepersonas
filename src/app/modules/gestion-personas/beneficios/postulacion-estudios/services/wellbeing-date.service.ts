import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingDateService {

  constructor() {}

  // =========================================
  // 🔥 TODAY
  // =========================================

  today(): Date {

    return new Date();
  }

  // =========================================
  // 🔥 FORMAT CL
  // =========================================

  formatCL(
    value?: string | Date | null,
  ): string {

    if (!value) {
      return '';
    }

    return new Date(value)
      .toLocaleDateString('es-CL');
  }

  // =========================================
  // 🔥 YEARS BETWEEN
  // =========================================

  yearsBetween(
    from: Date,
    to: Date = new Date(),
  ): number {

    let years =
      to.getFullYear() -
      from.getFullYear();

    const month =
      to.getMonth() -
      from.getMonth();

    if (
      month < 0 ||
      (
        month === 0 &&
        to.getDate() < from.getDate()
      )
    ) {
      years--;
    }

    return years;
  }

  // =========================================
  // 🔥 MONTHS BETWEEN
  // =========================================

  monthsBetween(
    from: Date,
    to: Date = new Date(),
  ): number {

    return (
      (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth())
    );
  }

  // =========================================
  // 🔥 IS SAME DAY
  // =========================================

  isSameDay(
    d1: Date,
    d2: Date,
  ): boolean {

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // =========================================
  // 🔥 TO DATE ONLY
  // =========================================

  toDateOnly(
    value: string | Date,
  ): Date {

    const d = new Date(value);

    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
    );
  }
}