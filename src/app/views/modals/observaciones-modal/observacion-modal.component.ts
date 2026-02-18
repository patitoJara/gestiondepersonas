// C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\views\modals\observaciones-modal\observacion-modal.component.ts
// observacion-modal.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface ObservacionModalData {
  observacion?: string;
  context?: 'DEMAND' | 'CITACION' | string;
  registerId?: number;
}

@Component({
  selector: 'app-observacion-modal',
  standalone: true,
  templateUrl: './observacion-modal.component.html',
  styleUrls: ['./observacion-modal.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,

    // 🔑 Material necesarios para el template
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,    
  ],
})
export class ObservacionModalComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ObservacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ObservacionModalData
  ) {
    this.form = this.fb.group({
      observacion: [
        data?.observacion ?? '',
        [Validators.required, Validators.maxLength(500)],
      ],
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  confirmar(): void {
    if (this.form.invalid) return;

    this.dialogRef.close({
      observacion: this.form.value.observacion,
      context: this.data?.context,
      registerId: this.data?.registerId,
      createdAt: new Date(),
    });
  }
}
