import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppCacheService {
  private readonly versionKey = 'gestionPersonasCacheVersion';

  private readonly appVersion = '2026-06-16-01';

  clearBeforeLoginIfNeeded(): void {
    try {
      const currentVersion = localStorage.getItem(this.versionKey);

      if (currentVersion === this.appVersion) {
        return;
      }

      this.clearSessionStorage();
      this.clearCacheStorage();

      localStorage.setItem(this.versionKey, this.appVersion);

      console.log('[AppCacheService] Cache de aplicación limpiado.');
    } catch (error) {
      console.warn('No fue posible limpiar cache antes del login:', error);
    }
  }

  private clearSessionStorage(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('No fue posible limpiar sessionStorage:', error);
    }
  }

  private clearCacheStorage(): void {
    if (!('caches' in window)) {
      return;
    }

    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch((error) => {
        console.warn('No fue posible limpiar Cache Storage:', error);
      });
  }
}