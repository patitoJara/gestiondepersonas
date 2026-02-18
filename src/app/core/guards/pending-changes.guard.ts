// src/app/core/guards/pending-changes.guard.ts

import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PendingChangesComponent } from './pending-changes.interface';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';

export const pendingChangesGuard: CanDeactivateFn<PendingChangesComponent> = (
  component
) => {
  // 🟢 No hay cambios → salir sin molestar
  if (!component.hasPendingChanges()) {
    return true;
  }

  const dialog = inject(MatDialog);

  // 🔔 Hay cambios → preguntar
  return dialog
    .open(ConfirmDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Cambios sin guardar',
        message:
          'Existen modificaciones sin guardar. Si sales ahora, perderás los cambios realizados.',
        confirmText: 'Salir sin guardar',
        cancelText: 'Permanecer',
        icon: 'warning',
        color: 'warn',
      },
    })
    .afterClosed();
};

