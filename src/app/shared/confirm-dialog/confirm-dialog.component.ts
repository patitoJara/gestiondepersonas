// src/app/shared/confirm-dialog/confirm-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Diálogo de confirmación estándar (Aceptar / Cancelar)
 * Uso: acciones importantes pero reversibles
 */
export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;               // default: 'Aceptar'
  cancelText?: string;                // default: 'Cancelar'
  color?: 'primary' | 'accent' | 'warn';
  icon?: string;                      // ej: 'delete', 'warning', 'info'
  dense?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon *ngIf="data.icon" class="dialog-icon">
        {{ data.icon }}
      </mat-icon>
      {{ data.title || 'Confirmar acción' }}
    </h2>

    <mat-dialog-content [style.padding.px]="data.dense ? 8 : 16">
      <p class="dialog-message">
        {{ data.message }}
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end" [style.padding.px]="data.dense ? 8 : 16">
      <button
        mat-stroked-button
        type="button"
        (click)="onCancel()"
      >
        {{ data.cancelText || 'Cancelar' }}
      </button>

      <button
        mat-flat-button
        type="button"
        [color]="data.color || 'primary'"
        cdkFocusInitial
        (click)="onConfirm()"
        (keydown.enter)="onConfirm()"
      >
        {{ data.confirmText || 'Aceptar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1976d2; 
      }

      .dialog-icon {
        opacity: 0.9;
      }

      .dialog-message {
        margin: 0;
        white-space: pre-wrap;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    private ref: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.ref.close(true);
  }

  onCancel(): void {
    this.ref.close(false);
  }
}


/* ejemplo de Uso


import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';


  this.dialog.open(ConfirmDialogComponent, {
    width: '420px',
    disableClose: true,
    data: {
      title: 'Eliminar registro',
      message: '¿Está seguro que desea eliminar este registro?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      icon: 'delete',
      color: 'warn',
    },
  }).afterClosed().subscribe(ok => {
    if (ok) {
      // acción confirmada
    }
  });



*/