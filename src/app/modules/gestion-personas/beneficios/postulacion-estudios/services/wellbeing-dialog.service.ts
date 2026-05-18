import { Injectable, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { ConfirmDialogOkComponent }
from '@app/shared/confirm-dialog/confirm-dialog-ok.component';

@Injectable({
  providedIn: 'root',
})
export class WellbeingDialogService {

  // =========================================
  // 🔥 INJECTS
  // =========================================

  private dialog =
    inject(MatDialog);

  constructor() {}

  // =========================================
  // 🔥 SUCCESS
  // =========================================

  success(
    message: string,
  ): void {

    this.dialog.open(
      ConfirmDialogOkComponent,
      {
        width: '420px',

        data: {
          title: 'Operación exitosa',

          message,
        },
      },
    );
  }

  // =========================================
  // 🔥 ERROR
  // =========================================

  error(
    message: string,
  ): void {

    this.dialog.open(
      ConfirmDialogOkComponent,
      {
        width: '420px',

        data: {
          title: 'Error',

          message,
        },
      },
    );
  }

  // =========================================
  // 🔥 WARNING
  // =========================================

  warning(
    message: string,
  ): void {

    this.dialog.open(
      ConfirmDialogOkComponent,
      {
        width: '420px',

        data: {
          title: 'Advertencia',

          message,
        },
      },
    );
  }
}