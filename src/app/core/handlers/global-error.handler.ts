import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.group('🔥 ERROR GLOBAL ANGULAR CAPTURADO');

    console.error('Error completo:', error);

    if (error?.message) {
      console.error('Mensaje:', error.message);
    }

    if (error?.stack) {
      console.error('Stack:', error.stack);
    }

    console.groupEnd();

    // Importante:
    // no relanzar el error para evitar pantalla blanca permanente.
  }
}