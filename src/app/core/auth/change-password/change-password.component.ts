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
import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';


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
  private usersService = inject(UsersService);

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
    if (this.loading) return;

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

    const { currentPassword, newPassword } = this.form.value;

    // 🔥 obtener usuario actual desde session
    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
    const userId = profile.id;

    if (!userId) {
      this.snackBar.open('No se pudo identificar al usuario.', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.loading = true;

    // 🔥 1. obtener usuario
    this.usersService.getById(userId).subscribe({
      next: (user: any) => {
        const updatedUser = {
          id: user.id,
          firstName: user.firstName,
          secondName: user.secondName,
          firstLastName: user.firstLastName,
          secondLastName: user.secondLastName,
          email: user.email,
          username: user.username,
          rut: user.rut,

          // 🔥 cambio real
          password: newPassword,
        };

        // 🔥 2. actualizar
        this.usersService.updateUser(userId, updatedUser).subscribe({
          next: () => {
            this.loading = false;

            this.snackBar.open(
              '✅ Contraseña actualizada correctamente.',
              'OK',
              {
                duration: 3000,
                panelClass: ['warn-snackbar'],
              },
            );

            this.form.reset();

            setTimeout(() => this.router.navigate(['/auth/login']), 1500);
          },
          error: (err) => {
            this.loading = false;

            console.error(err);

            this.snackBar.open('Error al actualizar la contraseña.', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          },
        });
      },
      error: (err) => {
        this.loading = false;
        console.error(err);

        this.snackBar.open('Error al obtener usuario.', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  back(): void {
    this.router.navigate(['/inicio']);
  }
}
