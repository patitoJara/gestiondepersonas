// C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\views\contact\contact-edit-dialog\contact-edit-dialog.component.ts

import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';

import { firstValueFrom } from 'rxjs';
import { ContactService } from '@app/services/contact.service';
import { PreloadCatalogsService } from '@app/services/demand/preload-catalogs.service';
import { Contact } from '@app/models/contact';
import { DemandUtilsService } from '@app/services/demand/demand-utils.service';
import { distinctUntilChanged } from 'rxjs/operators';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'app-contact-edit-dialog',
  standalone: true,
  templateUrl: './contact-edit-dialog.component.html',
  styleUrls: ['./contact-edit-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class ContactEditDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private dialogRef: MatDialogRef<ContactEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contactId: number },
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.data?.contactId) {
      this.dialogRef.close();
      return;
    }

    this.form = this.fb.group({
      name: ['', Validators.required],
      cellphone: ['', Validators.required],
      email: ['', [Validators.email, Validators.pattern(EMAIL_REGEX)]],
      description: [''],
    });

    const contact = await firstValueFrom(
      this.contactService.getById(this.data.contactId),
    );

    this.form.patchValue(contact);

    this.form.patchValue(contact);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  hasPendingChanges(): boolean {
    return this.form?.dirty === true;
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) return;

    await firstValueFrom(
      this.contactService.update(this.data.contactId, this.form.value),
    );

    this.dialogRef.close(true);
  }

  cancelar(): void {
    if (!this.hasPendingChanges()) {
      this.dialogRef.close(false);
      return;
    }

    const confirmar = confirm(
      'Existen cambios sin guardar. Si sales ahora, se perderán.',
    );

    if (confirmar) {
      this.dialogRef.close(false);
    }
  }
}
