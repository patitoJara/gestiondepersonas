import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingAutosaveService {

  // =========================================
  // 🔥 TIMER
  // =========================================

  private timer: any;

  constructor() {}

  // =========================================
  // 🔥 RUN
  // =========================================

  run(
    callback: () => void,
    delay: number = 1000,
  ): void {

    this.clear();

    this.timer = setTimeout(
      () => {
        callback();
      },
      delay,
    );
  }

  // =========================================
  // 🔥 CLEAR
  // =========================================

  clear(): void {

    if (this.timer) {

      clearTimeout(
        this.timer,
      );

      this.timer = null;
    }
  }
}