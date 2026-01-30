import { Component, Inject, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule
} from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-form',
  imports: [

    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule, MatDialogModule, MatFormField,
    MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css'
})
export class FormComponent {
  taskForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      name: [this.data?.name || ''],
      description: [this.data?.description || '']
    });

  }

  save() {
    if (this.taskForm.valid) {
      this.dialogRef.close(this.taskForm.value); // <-- Aquí se retorna el resultado
    }
  }


}
