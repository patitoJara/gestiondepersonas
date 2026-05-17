import { Component, Inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PostulationSummaryResponse } from '../postulacion-estudios/models/postulation-summary-response.model';

@Component({
  selector: 'app-postulation-resume-dialog',

  standalone: true,

  imports: [CommonModule, MatIconModule],

  templateUrl: './postulation-resume-dialog.component.html',

  styleUrls: ['./postulation-resume-dialog.component.scss'],
})
export class PostulationResumeDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<PostulationResumeDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: PostulationSummaryResponse[],
  ) {}

  continue(postulation: PostulationSummaryResponse) {
    this.dialogRef.close({
      action: 'continue',

      postulation,
    });
  }

  createNew() {
    this.dialogRef.close({
      action: 'new',
    });
  }

  deleteDraft(postulation: PostulationSummaryResponse) {
    this.dialogRef.close({
      action: 'delete',

      postulation,
    });
  }

  close() {
    this.dialogRef.close(null);
  }

  formatDate(date: string): string {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleString('es-CL', {
      dateStyle: 'short',

      timeStyle: 'short',
    });
  }

  private readonly statusMap: Record<string, string> = {
    DRAFT: 'BORRADOR',

    SUBMITTED: 'ENVIADA',

    APPROVED: 'APROBADA',

    REJECTED: 'RECHAZADA',
  };

  translateStatus(status: string): string {
    return this.statusMap[status] || status;
  }

  getActionLabel(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Continuar';

      case 'SUBMITTED':
        return 'Ver';

      case 'APPROVED':
        return 'Resolución';

      case 'REJECTED':
        return 'Revisar';

      default:
        return 'Abrir';
    }
  }
}
