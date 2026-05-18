import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingStorageService {

  // =========================================
  // 🔥 STORAGE KEYS
  // =========================================

  private POSTULATION_ID_KEY =
    'wellbeing_postulation_id';

  private CURRENT_STEP_KEY =
    'wellbeing_current_step';

  constructor() {}

  // =========================================
  // 🔥 POSTULATION ID
  // =========================================

  savePostulationId(
    id: number,
  ): void {

    localStorage.setItem(
      this.POSTULATION_ID_KEY,
      id.toString(),
    );
  }

  getPostulationId():
    number | null {

    const value =
      localStorage.getItem(
        this.POSTULATION_ID_KEY,
      );

    return value
      ? Number(value)
      : null;
  }

  clearPostulationId(): void {

    localStorage.removeItem(
      this.POSTULATION_ID_KEY,
    );
  }

  // =========================================
  // 🔥 CURRENT STEP
  // =========================================

  saveCurrentStep(
    step: number,
  ): void {

    localStorage.setItem(
      this.CURRENT_STEP_KEY,
      step.toString(),
    );
  }

  getCurrentStep():
    number {

    const value =
      localStorage.getItem(
        this.CURRENT_STEP_KEY,
      );

    return value
      ? Number(value)
      : 1;
  }

  clearCurrentStep(): void {

    localStorage.removeItem(
      this.CURRENT_STEP_KEY,
    );
  }

  // =========================================
  // 🔥 CLEAR ALL
  // =========================================

  clearAll(): void {

    this.clearPostulationId();

    this.clearCurrentStep();
  }
}