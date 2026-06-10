import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private requestCount = 0;

  private manualLock = false;

  private showTimeout: ReturnType<typeof setTimeout> | null = null;

  private safetyTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _loading = new BehaviorSubject<boolean>(false);

  readonly loading$ = this._loading
    .asObservable()
    .pipe(distinctUntilChanged());

  // =========================================================
  // 🔥 LOADER NORMAL PARA REQUESTS CORTOS
  // =========================================================

  show(): void {
    if (this.manualLock) {
      return;
    }

    this.requestCount++;

    if (this.requestCount === 1) {
      this.clearShowTimeout();

      this.showTimeout = setTimeout(() => {
        this._loading.next(true);
      }, 120);
    }
  }

  hide(): void {
    if (this.manualLock) {
      return;
    }

    if (this.requestCount > 0) {
      this.requestCount--;
    }

    if (this.requestCount === 0) {
      this.clearShowTimeout();

      this._loading.next(false);
    }
  }

  // =========================================================
  // 🔒 BLOQUEO MANUAL PARA PDF Y EXCEL
  // =========================================================
  // Por defecto permite hasta 2 minutos.
  // =========================================================

  lock(timeoutMs = 120000): void {
    this.clearSafetyTimeout();

    this.manualLock = true;

    this.requestCount = 0;

    Promise.resolve().then(() => {
      this._loading.next(true);
    });

    this.safetyTimeout = setTimeout(() => {
      if (!this.manualLock) {
        return;
      }

      console.warn(
        `⚠️ Loader liberado por timeout después de ${timeoutMs / 1000} segundos`,
      );

      this.unlock();
    }, timeoutMs);
  }

  unlock(): void {
    this.clearSafetyTimeout();

    this.clearShowTimeout();

    this.manualLock = false;

    this.requestCount = 0;

    Promise.resolve().then(() => {
      this._loading.next(false);
    });
  }

  // =========================================================
  // 🔥 INTERNAL HELPERS
  // =========================================================

  private clearShowTimeout(): void {
    if (!this.showTimeout) {
      return;
    }

    clearTimeout(this.showTimeout);

    this.showTimeout = null;
  }

  private clearSafetyTimeout(): void {
    if (!this.safetyTimeout) {
      return;
    }

    clearTimeout(this.safetyTimeout);

    this.safetyTimeout = null;
  }
}