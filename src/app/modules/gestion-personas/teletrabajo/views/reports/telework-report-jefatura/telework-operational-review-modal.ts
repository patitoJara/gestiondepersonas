import { Component, Inject, inject } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { MatDialog } from '@angular/material/dialog';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { RegisterReview } from '../../../models/register-review.model';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { RegisterReviewService } from '../../../services/reports/register-review.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-telework-operational-review-modal',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],

  templateUrl: './telework-operational-review-modal.html',
  styleUrls: ['./telework-operational-review-modal.scss'],
})
export class TeleworkOperationalReviewModal {
  // =========================================================
  // INJECT
  // =========================================================

  private registerReviewService = inject(RegisterReviewService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // =========================================================
  // STATES
  // =========================================================

  reviewStates = ['REVIEW', 'OBSERVED', 'CRITICAL'];

  loading = false;

  // =========================================================
  // REVIEW
  // =========================================================

  review: any = {
    observations: '',
    state: 'REVIEW',
  };

  workedHours = 0;
  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private dialogRef: MatDialogRef<TeleworkOperationalReviewModal>,

    @Inject(MAT_DIALOG_DATA)
    public data: any,
  ) {
    console.log('📦 MODAL DATA:', data);

    this.review = {
      // 🔥 OBSERVACIÓN
      observations:
        data?.review?.observations ||
        data?.entryReview?.observations ||
        data?.exitReview?.observations ||
        '',
      // 🔥 ESTADO
      state:
        data?.review?.state ||
        data?.entryReview?.state ||
        data?.exitReview?.state ||
        'REVIEW',

      // 🔥 HORAS OPERACIONALES
      entryTime: data?.entryTime || '',

      exitTime: data?.exitTime || '',
    };

    this.recalculateWorkedHours();
  }

  isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }

  // =========================================================
  // SAVE
  // =========================================================

  async save(): Promise<void> {
    // =====================================
    // 🔥 NORMALIZAR 00:00 → 08:00
    // =====================================

    if (!this.review.entryTime || this.review.entryTime === '00:00') {
      this.review.entryTime = '08:00';
    }

    if (!this.review.exitTime || this.review.exitTime === '00:00') {
      this.review.exitTime = '08:00';
    }

    // =====================================
    // 🔥 SAVE
    // =====================================

    this.dialogRef.close({
      state: this.review.state,

      observations: this.review.observations,

      entryTime: this.review.entryTime,

      exitTime: this.review.exitTime,
    });
  }

  getStateLabel(state: string): string {
    switch (state) {
      case 'REVIEW':
        return 'Regularizar jornada';

      case 'OBSERVED':
        return 'Jornada incompleta';

      case 'CRITICAL':
        return 'No validar';

      default:
        return state;
    }
  }

  recalculateWorkedHours(): void {
    if (
      !this.isValidTime(this.review.entryTime) ||
      !this.isValidTime(this.review.exitTime)
    ) {
      this.workedHours = 0;

      return;
    }

    // 🚫 NO permitir 00:00
    if (this.review.entryTime === '00:00' || this.review.exitTime === '00:00') {
      this.workedHours = 0;

      return;
    }

    const [eh, em] = this.review.entryTime.split(':').map(Number);

    const [sh, sm] = this.review.exitTime.split(':').map(Number);

    const entry = new Date();

    entry.setHours(eh, em, 0, 0);

    const exit = new Date();

    exit.setHours(sh, sm, 0, 0);

    const diff = exit.getTime() - entry.getTime();

    if (diff < 0) {
      this.workedHours = 0;

      return;
    }

    this.workedHours = Number((diff / (1000 * 60 * 60)).toFixed(1));
  }

  // =========================================================
  // CLOSE
  // =========================================================

  close(): void {
    this.dialogRef.close();
  }
}
