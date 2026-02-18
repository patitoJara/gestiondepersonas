//C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\shared\confirm-dialog\confirm-dialog-yes-no.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogYesNoData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog-yes-no',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon *ngIf="data.icon" class="dialog-icon">
        {{ data.icon }}
      </mat-icon>
      {{ data.title }}
    </h2>

    <mat-dialog-content>
      <p class="dialog-message">{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">
        {{ data.cancelText || 'Cancelar' }}
      </button>

      <button
        mat-flat-button
        [color]="data.color || 'warn'"
        cdkFocusInitial
        (click)="confirm()"
      >
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 8px;
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
export class ConfirmDialogYesNoComponent {
  constructor(
    private ref: MatDialogRef<ConfirmDialogYesNoComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogYesNoData
  ) {}

  cancel(): void {
    this.ref.close(false);
  }

  confirm(): void {
    this.ref.close(true);
  }

    
}
