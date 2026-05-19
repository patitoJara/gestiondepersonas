import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WellbeingLoadingService {

  // =========================================
  // 🔥 LOADING
  // =========================================

  loading$ =
    new BehaviorSubject<boolean>(false);

  constructor() {}

  // =========================================
  // 🔥 SHOW
  // =========================================

  show(): void {

    this.loading$.next(true);
  }

  // =========================================
  // 🔥 HIDE
  // =========================================

  hide(): void {

    this.loading$.next(false);
  }

  // =========================================
  // 🔥 TOGGLE
  // =========================================

  toggle(): void {

    this.loading$.next(
      !this.loading$.value,
    );
  }
}