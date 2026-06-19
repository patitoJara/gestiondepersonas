import {
  Component,
  inject,
  AfterViewInit,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';

// Servicios
import { AuthLoginService } from '@app/core/auth/services/auth.login.service';
import { TokenService } from '@app/core/services/token.service';
import { SessionService } from '@app/core/services/session.service';
import { AppCacheService } from '@app/core/services/app-cache.service';
import { environment } from 'src/environments/environment';

// Dialog
import { ErrorConfirmDialogComponent } from '@app/shared/confirm-dialog/errorConfirmDialogComponent';
import { finalize } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    A11yModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthLoginService);
  private tokenService = inject(TokenService);
  private sessionService = inject(SessionService);
  private appCacheService = inject(AppCacheService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  hidePwd = true;
  loading = false;
  error = '';

  form = this.fb.group({
    email: [
      localStorage.getItem('last_email') ?? '',
      [Validators.required, Validators.email],
    ],
    password: ['', [Validators.required]],
    remember: [!!localStorage.getItem('last_email')],
  });

  constructor() {
    if (environment.enableDebugTools) {
      console.log(
        '[LoginComponent] 🟢 Componente de login cargado correctamente (tokens ya limpios)',
      );
    }
  }

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.appCacheService.clearBeforeLoginIfNeeded();
  }

  // src/app/telework/views/auth/login/login.component.ts

  login(): void {
    (document.activeElement as HTMLElement)?.blur();
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, remember } = this.form.getRawValue();
    if (!email || !password) return;

    this.loading = true;

    this.auth
      .login(email, password)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          console.log('[login.component] respuesta backend:', res);

          // =====================================
          // 🔥 VALIDACIÓN FLEXIBLE DEL TOKEN
          // =====================================

          const token =
            res?.token ||
            res?.accessToken ||
            res?.access_token ||
            this.tokenService.getAccessToken?.();

          if (!token) {
            console.warn(
              '[login.component] ⚠️ Login correcto, pero sin token visible',
            );
            this.mostrarErrorLogin(
              'El correo o la contraseña son incorrectos.',
            );
            return;
          }

          // =====================================
          // 🔐 TOKENS
          // Solo guardar si vienen en la respuesta.
          // Si AuthLoginService ya los guardó, no molestamos.
          // =====================================

          if (res?.token || res?.accessToken || res?.access_token) {
            this.tokenService.setTokens(
              res.token || res.accessToken || res.access_token,
              res.refreshToken || res.refresh_token,
            );
          }

          // =====================================
          // 👤 PERFIL
          // =====================================

          if (res?.profile) {
            this.tokenService.setUserProfile(res.profile);
          }

          // =====================================
          // 🎭 ROLES
          // =====================================

          if (res?.roles) {
            this.tokenService.setUserRoles(res.roles);
          }

          console.log('[login.component] ✅ Login validado, navegando...');

          // =====================================
          // 💾 RECORDAR EMAIL
          // =====================================

          if (remember) {
            localStorage.setItem('last_email', email);
          } else {
            localStorage.removeItem('last_email');
          }

          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') ||
            '/gestion-personas/inicio';

          // =====================================
          // 🚀 NAVEGACIÓN + SESIÓN
          // =====================================

          this.router
            .navigateByUrl(returnUrl, { replaceUrl: true })
            .then((ok) => {
              console.log('[login.component] navegación resultado:', ok);

              if (ok) {
                this.sessionService.startSessionFromToken();
              } else if (environment.enableDebugTools) {
                console.warn('[login.component] ⚠️ Router no navegó');
              }
            });
        },

        error: (err) => {
          if (err.status === 401) {
            this.mostrarErrorLogin('Usuario o contraseña incorrectos.');
            return;
          }

          if (err.status === 403) {
            this.mostrarErrorLogin(
              'Tu usuario no tiene permisos para acceder al sistema.',
            );
            return;
          }

          this.mostrarErrorLogin(
            'No fue posible iniciar sesión. Intenta nuevamente.',
          );
        },
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.focusLoginButton(), 300);
    setTimeout(() => this.focusLoginButton(), 600);
    setTimeout(() => this.focusLoginButton(), 900);
  }

  private focusLoginButton(): void {
    const button = this.loginButton?.nativeElement;

    if (!button) {
      if (environment.enableDebugTools) {
        console.warn('[login] ⚠️ Botón INGRESAR no encontrado');
      }
      return;
    }

    button.focus();

    if (environment.enableDebugTools) {
      console.log('[login] 🎯 Foco actual:', document.activeElement);
    }
  }

  goToRecover(): void {
    const emailInput = document.querySelector(
      'input[formControlName="email"]',
    ) as HTMLInputElement;

    const email = emailInput?.value?.trim() || '';
    this.router.navigate(['/auth/recover'], { queryParams: { email } });
  }

  @ViewChild('loginButton') loginButton!: ElementRef<HTMLButtonElement>;

  private mostrarErrorLogin(mensaje: string): void {
    this.dialog
      .open(ErrorConfirmDialogComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: 'Error de inicio de sesión',
          message: mensaje,
          confirmText: 'Aceptar',
          color: 'warn',
          icon: 'error',
          dense: true,
        },
      })
      .afterClosed()
      .subscribe(() => {
        this.focusLoginButton();
      });
  }
}
