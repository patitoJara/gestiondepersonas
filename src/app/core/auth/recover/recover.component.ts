import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

// Servicio de correo
import { UsersService } from '@app/core/services/email.service';

@Component({
  standalone: true,
  selector: 'app-recover',
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
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss'],
})
export class RecoverComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private usersService = inject(UsersService);

  loading = false;
  sent = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) this.form.patchValue({ email: emailParam });
  }

  /** 🔹 Volver al login conservando el email */
  backToLogin(): void {
    const email = this.form.get('email')?.value;
    this.router.navigate(['/auth/login'], { queryParams: { email } });
  }

  /** 🔹 Envía correo a soporte con copia al usuario */
  recover(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email!;
    this.loading = true;

    this.usersService.recoverPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.sent = true;

        this.showSuccess();

        // 🔥 AQUÍ ESTÁ LA CLAVE
        setTimeout(() => {
          console.log('REDIRIGIENDO...');
          this.router.navigateByUrl('/auth/login');
        }, 8000);
      },

      error: (err) => {
        this.loading = false;

        // 🔥 DA LO MISMO si es 401 o 500
        this.showSuccess();

        // 👀 pero log interno
        console.warn('[Recover] ERROR COMPLETO:', err);
      },
    });
  }

  private showSuccess() {
    this.snackBar.open(
      '📩 Si el correo está registrado, recibirás instrucciones.',
      'Cerrar',
      {
        duration: 4000,
        panelClass: ['success-snackbar'],
      },
    );
  }
}
