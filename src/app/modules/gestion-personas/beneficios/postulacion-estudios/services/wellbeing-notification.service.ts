import { Injectable, inject } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class WellbeingNotificationService {

  // =========================================
  // 🔥 INJECTS
  // =========================================

  private snackBar =
    inject(MatSnackBar);

  constructor() {}

  // =========================================
  // 🔥 SUCCESS
  // =========================================

  success(
    message: string,
    duration: number = 3000,
  ): void {

    this.snackBar.open(
      message,
      'OK',
      {
        duration,

        horizontalPosition: 'right',

        verticalPosition: 'top',

        panelClass: [
          'snackbar-success',
        ],
      },
    );
  }

  // =========================================
  // 🔥 ERROR
  // =========================================

  error(
    message: string,
    duration: number = 4000,
  ): void {

    this.snackBar.open(
      message,
      'Cerrar',
      {
        duration,

        horizontalPosition: 'right',

        verticalPosition: 'top',

        panelClass: [
          'snackbar-error',
        ],
      },
    );
  }

  // =========================================
  // 🔥 WARNING
  // =========================================

  warning(
    message: string,
    duration: number = 3500,
  ): void {

    this.snackBar.open(
      message,
      'Cerrar',
      {
        duration,

        horizontalPosition: 'right',

        verticalPosition: 'top',

        panelClass: [
          'snackbar-warning',
        ],
      },
    );
  }

  // =========================================
  // 🔥 INFO
  // =========================================

  info(
    message: string,
    duration: number = 3000,
  ): void {

    this.snackBar.open(
      message,
      'OK',
      {
        duration,

        horizontalPosition: 'right',

        verticalPosition: 'top',

        panelClass: [
          'snackbar-info',
        ],
      },
    );
  }
}