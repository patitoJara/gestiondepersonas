import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthLoginService } from '@app/core/auth/services/auth.login.service';
import { TokenService } from '@app/core/services/token.service';
import { UsersService } from '../../services/admin/users.service';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { ErrorConfirmDialogComponent } from '@app/shared/confirm-dialog/errorConfirmDialogComponent';

interface DecodedToken {
  fullName?: string;
  username?: string;
  email?: string;
  roles?: string[];
  programs?: string[];
  exp?: number;
  iat?: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private dialog = inject(MatDialog);
  private auth = inject(AuthLoginService);
  private tokenService = inject(TokenService);
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  userData: DecodedToken | null = null;
  loading = false;

  passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator,
    },
  );

  passwordMatchValidator(form: any) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  /** 🔍 Decodifica token y carga datos */
  loadProfile(): void {
    const token = this.tokenService.getAccessToken();

    if (!token) {
      console.warn('[Profile] No hay token disponible.');
      this.router.navigate(['/auth/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as DecodedToken;
      this.userData = payload;
    } catch (err) {
      this.dialog.open(ErrorConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Datos del Usuario',
          message: 'Error al cargar los datos del usuario.',
          icon: 'warning',
          color: 'accent',
          confirmText: 'Revisar',
        },
      });
    }
  }

  /** 🔐 CAMBIO REAL DE CONTRASEÑA */
  changePassword(): void {
    if (this.loading) return;
    console.log('CLICK CHANGE PASSWORD 🔥');
    const { currentPassword, newPassword, confirmPassword } =
      this.passwordForm.value;

    console.log('FORM 👉', this.passwordForm.value);

    // 🔥 Validación formulario
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    // 🔥 Validación confirmación
    if (newPassword !== confirmPassword) {
      this.dialog.open(ErrorConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Datos incorrectos',
          message: 'La nueva contraseña y su confirmación no coinciden.',
          icon: 'warning',
          color: 'accent',
          confirmText: 'Revisar',
        },
      });
      return;
    }

    if (!currentPassword) {
      this.dialog.open(ErrorConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Falta información',
          message: 'Debe ingresar su contraseña actual.',
          icon: 'warning',
          color: 'accent',
          confirmText: 'Aceptar',
        },
      });
      return;
    }

    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
    const userId = profile.id;

    if (!userId) {
      this.dialog.open(ErrorConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Error',
          message: 'No se pudo obtener el usuario actual.',
          icon: 'error',
          color: 'warn',
          confirmText: 'Aceptar',
        },
      });
      return;
    }

    this.loading = true;

    this.usersService
      .changePassword(userId, {
        currentPassword: currentPassword!,
        newPassword: newPassword!,
        confirmPassword: confirmPassword!,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.passwordForm.reset();

          this.dialog.open(ConfirmDialogOkComponent, {
            width: '420px',
            data: {
              title: 'Contraseña actualizada',
              message: 'Tu contraseña fue actualizada correctamente.',
              icon: 'check_circle',
              color: 'primary',
              confirmText: 'Aceptar',
            },
          });
        },
        error: (err) => {
          this.loading = false;

          console.error('ERROR CHANGE PASSWORD 👉', err);

          this.dialog.open(ErrorConfirmDialogComponent, {
            width: '420px',
            data: {
              title: 'Error',
              message:
                err?.error?.message || 'No se pudo actualizar la contraseña.',
              icon: 'error',
              color: 'warn',
              confirmText: 'Aceptar',
            },
          });
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/inicio']);
  }
}
