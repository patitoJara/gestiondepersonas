import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingErrorService {

  constructor() {}

  // =========================================
  // 🔥 GET MESSAGE
  // =========================================

  getErrorMessage(
    error: any,
  ): string {

    // =====================================
    // 🔥 401
    // =====================================

    if (error?.status === 401) {
      return 'Sesión expirada o sin autorización.';
    }

    // =====================================
    // 🔥 403
    // =====================================

    if (error?.status === 403) {
      return 'No posee permisos para realizar esta acción.';
    }

    // =====================================
    // 🔥 404
    // =====================================

    if (error?.status === 404) {
      return 'No se encontró el recurso solicitado.';
    }

    // =====================================
    // 🔥 500
    // =====================================

    if (error?.status === 500) {
      return 'Ocurrió un error interno en el servidor.';
    }

    // =====================================
    // 🔥 BACKEND MESSAGE
    // =====================================

    if (error?.error?.message) {
      return error.error.message;
    }

    // =====================================
    // 🔥 DEFAULT
    // =====================================

    return 'Ocurrió un error inesperado.';
  }

  // =========================================
  // 🔥 LOG ERROR
  // =========================================

  log(
    context: string,
    error: any,
  ): void {

    console.error(
      `🔥 [${context}]`,
      error,
    );
  }
}