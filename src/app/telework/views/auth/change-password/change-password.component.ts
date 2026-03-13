// C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\views\auth\change-password\change-password.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

// Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';


@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  hideOld = true;
  hideNew = true;
  hideConfirm = true;
  loading = false;

  form = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  get f() {
    return this.form.controls;
  }

  /** 🔹 Verifica que las contraseñas coincidan */
  passwordsMatch(): boolean {
    return this.form.value.newPassword === this.form.value.confirmPassword;
  }

  /** 🔐 Acción principal */
  changePassword(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.passwordsMatch()) {
      this.snackBar.open('Las contraseñas no coinciden.', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.loading = true;
    const { currentPassword, newPassword } = this.form.value;

    console.log('[ChangePassword] Datos enviados:', { currentPassword, newPassword });

    // Simulación de cambio en backend
    setTimeout(() => {
      this.loading = false;
      this.snackBar.open('✅ Contraseña actualizada correctamente.', 'OK', {
        duration: 3000,
        panelClass: ['warn-snackbar'],
      });

      // Limpia formulario
      this.form.reset();

      // Regreso al login
      setTimeout(() => this.router.navigate(['/auth/login']), 1500);
    }, 2000);
  }

  back(): void {
    this.router.navigate(['/inicio']);
  }
}
