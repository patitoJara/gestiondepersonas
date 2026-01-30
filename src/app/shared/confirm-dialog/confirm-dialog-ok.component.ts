// src/app/shared/confirm-dialog/confirm-dialog-ok.component.ts

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
 * Diálogo informativo (solo OK)
 * Uso: mensajes, advertencias, validaciones
 */
export interface ConfirmDialogOkData {
  title?: string;
  message: string;
  confirmText?: string; // default: 'Aceptar'
  color?: 'primary' | 'accent' | 'warn';
  icon?: string; // ej: 'info', 'print', 'warning'
  dense?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog-ok',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon *ngIf="data.icon" class="dialog-icon">
        {{ data.icon }}
      </mat-icon>
      {{ data.title || 'Información' }}
    </h2>

    <mat-dialog-content [style.padding.px]="data.dense ? 8 : 16">
      <div
        class="dialog-message"
        [innerHTML]="data.message">
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" [style.padding.px]="data.dense ? 8 : 16">
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
        font-weight: 500;
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
export class ConfirmDialogOkComponent {
  constructor(
    private ref: MatDialogRef<ConfirmDialogOkComponent, true>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogOkData
  ) {}

  onConfirm(): void {
    this.ref.close(true);
  }
}

/* ejemplo de uso 

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';

export class xxxxxxxxx implements OnInit {
  private dialog = inject(MatDialog);


  this.dialog.open(ConfirmDialogOkComponent, {
    width: '420px',
    disableClose: true,
    data: {
          title: 'Error en contraseñas',
          message: 'Las contraseñas no coinciden.',
          icon: 'check_circle',
          color: 'primary',
          confirmText: 'Aceptar',
  });


*/
