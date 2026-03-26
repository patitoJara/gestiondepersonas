//src\app\telework\services\loader.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private requestCount = 0;
  private manualLock = false;
  private showTimeout: any;

  private readonly _loading = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading.asObservable().pipe(distinctUntilChanged());

  show(): void {
    if (this.manualLock) return;

    this.requestCount++;

    if (this.requestCount === 1) {
      this.showTimeout = setTimeout(() => {
        this._loading.next(true);
      }, 120); // 🔥 suaviza pestañazos
    }
  }

  hide(): void {
    if (this.manualLock) return;

    if (this.requestCount > 0) {
      this.requestCount--;
    }

    if (this.requestCount === 0) {
      clearTimeout(this.showTimeout);
      this._loading.next(false);
    }
  }

  // 🔒 BLOQUEO MANUAL SUPERIOR
  lock(): void {
    this.manualLock = true;
    this.requestCount = 0;

    Promise.resolve().then(() => {
      this._loading.next(true);
    });

    // ⏱️ seguridad 30 segundos
    setTimeout(() => {
      if (this.manualLock) {
        console.warn('⚠️ Loader liberado por timeout');
        this.unlock();
      }
    }, 30000);
  }

  unlock(): void {
    this.manualLock = false;
    this.requestCount = 0;

    Promise.resolve().then(() => {
      this._loading.next(false);
    });
  }
}
