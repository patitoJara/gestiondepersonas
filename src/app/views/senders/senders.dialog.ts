// src/app/pages/senders/senders.dialog.ts


import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SenderService } from '../../services/sender.service';
import { Sender } from '../../models/sender';


@Component({
  standalone: true,
  selector: 'app-senders-dialog',
  templateUrl: './senders.dialog.html',
  styleUrls: ['./senders.dialog.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
]
})
export class SendersDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: SenderService,
    private ref: MatDialogRef<SendersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Sender | null
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [this.data?.id ?? null],
      name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    });
  }

  save(): void {
    const v = this.form.getRawValue() as { id: number | null; name: string };
    const req = v.id

      ? this.api.update(this.form.value.id, this.form.value)
      : this.api.save(this.form.value);

    req.subscribe({
      next: (row: Sender) => this.ref.close(row),
      error: (err: unknown) => console.error(err)
    });    
  }

  cancel(): void { this.ref.close(); }

}
