import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppCacheService {
  private readonly versionKey = 'gestionPersonasCacheVersion';

  private readonly formCleanedAtKey = 'gestionPersonasFormCacheLastCleanedAt';

  private readonly appVersion = '2026-06-17-01';

  /**
   * Claves conocidas de formularios que pueden quedar pegadas
   * entre sesiones o después de una actualización.
   */
  private readonly formLocalStorageKeysToRemove = [
    'last_route',

    // Postulación Bienestar / Estudios Superiores
    'wellbeing_current_step',
    'wellbeing_postulation_id',
    'wellbeing_workflow',

    // Formulario antiguo / respaldo completo
    'postulacion_full',

    // Posibles formularios futuros o existentes
    'postulation_current_step',
    'postulation_id',
    'postulation_workflow',

    'form_current_step',
    'form_id',
    'form_workflow',

    'wizard_current_step',
    'wizard_id',
    'wizard_workflow',
  ];

  /**
   * Prefijos asociados a formularios.
   * Esto permite limpiar nuevas claves sin tener que agregarlas una por una.
   */
  private readonly formLocalStoragePrefixesToRemove = [
    'wellbeing_',
    'postulation_',
    'postulacion_',
    'form_',
    'wizard_',
    'survey_',
    'encuesta_',
    'demand_',
    'demanda_',
  ];

  clearBeforeLoginIfNeeded(): void {
    try {
      this.clearSessionStorage();
      this.clearFormLocalStorage();

      localStorage.setItem(this.formCleanedAtKey, new Date().toISOString());

      const currentVersion = localStorage.getItem(this.versionKey);

      if (currentVersion !== this.appVersion) {
        this.clearCacheStorage();

        localStorage.setItem(this.versionKey, this.appVersion);

        console.log(
          '[AppCacheService] Cache Storage limpiado por cambio de versión.',
        );
      }

      console.log(
        '[AppCacheService] Datos temporales de formularios limpiados antes del login.',
      );
    } catch (error) {
      console.warn(
        '[AppCacheService] No fue posible limpiar cache antes del login:',
        error,
      );
    }
  }

  private clearSessionStorage(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn(
        '[AppCacheService] No fue posible limpiar sessionStorage:',
        error,
      );
    }
  }

  private clearFormLocalStorage(): void {
    try {
      for (const key of this.formLocalStorageKeysToRemove) {
        localStorage.removeItem(key);
      }

      const keys = Object.keys(localStorage);

      for (const key of keys) {
        const shouldRemove = this.formLocalStoragePrefixesToRemove.some(
          (prefix) => key.startsWith(prefix),
        );

        if (shouldRemove) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn(
        '[AppCacheService] No fue posible limpiar datos temporales de formularios:',
        error,
      );
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
        console.warn(
          '[AppCacheService] No fue posible limpiar Cache Storage:',
          error,
        );
      });
  }
}