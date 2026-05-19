import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingStepService {

  // =========================================
  // 🔥 TOTAL STEPS
  // =========================================

  readonly TOTAL_STEPS = 11;

  constructor() {}

  // =========================================
  // 🔥 NEXT STEP
  // =========================================

  next(
    current: number,
  ): number {

    if (current >= this.TOTAL_STEPS) {
      return this.TOTAL_STEPS;
    }

    return current + 1;
  }

  // =========================================
  // 🔥 PREVIOUS STEP
  // =========================================

  previous(
    current: number,
  ): number {

    if (current <= 1) {
      return 1;
    }

    return current - 1;
  }

  // =========================================
  // 🔥 IS FIRST
  // =========================================

  isFirst(
    step: number,
  ): boolean {

    return step === 1;
  }

  // =========================================
  // 🔥 IS LAST
  // =========================================

  isLast(
    step: number,
  ): boolean {

    return step === this.TOTAL_STEPS;
  }

  // =========================================
  // 🔥 PERCENTAGE
  // =========================================

  progress(
    step: number,
  ): number {

    return Math.round(
      (step / this.TOTAL_STEPS) * 100,
    );
  }

  // =========================================
  // 🔥 STEP TITLE
  // =========================================

  title(
    step: number,
  ): string {

    switch (step) {

      case 1:
        return 'Datos afiliado';

      case 2:
        return 'Grupo familiar';

      case 3:
        return 'Beneficiario';

      case 4:
        return 'Antecedentes académicos';

      case 5:
        return 'Antecedentes complementarios';

      case 6:
        return 'Ingresos familiares';

      case 7:
        return 'Gastos familiares';

      case 8:
        return 'Salud y vivienda';

      case 9:
        return 'Documentos';

      case 10:
        return 'Confirmación';

      case 11:
        return 'Postulación exitosa';

      default:
        return 'Paso';
    }
  }
}