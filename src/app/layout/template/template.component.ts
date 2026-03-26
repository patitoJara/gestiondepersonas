import {
  Component,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectorRef,
} from '@angular/core';

import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  Observable,
  map,
  shareReplay,
  interval,
  Subscription,
  firstValueFrom,
} from 'rxjs';

import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { OnDestroy } from '@angular/core';

import { TokenService } from '@app/core/services/token.service';
import { AuthLoginService } from '../../telework/services/auth.login.service';
import { SessionService } from '@app/core/services/session.service';
import { TimeService } from '@app/core/services/time.service';
import { routes } from '../../app.routes';

@Component({
  selector: 'app-template',
  standalone: true,
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss'],
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    FormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
})
export class TemplateComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;

  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private tokenService = inject(TokenService);
  private auth = inject(AuthLoginService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private sessionService = inject(SessionService);
  private cdr = inject(ChangeDetectorRef);
  private timeService = inject(TimeService);

  userFullName: string = 'Usuario';
  userUsername: string = '';
  userEmail: string = '';
  userRoles: string[] = [];
  title: string = '';
  icon: string = '';

  activeRole: string | null = null;

  decodedToken: any = null;

  menuItems: any[] = [];
  mantenedorItems: any[] = [];
  mantenedoresOpen = true;

  menuVisible = false;

  isLoading = false;

  remainingMinutes: number = 0;
  showExtendButton = false;
  isRefreshing = false;
  private timerSub?: Subscription;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(
      map((r) => r.matches),
      shareReplay(),
    );

  ngOnInit(): void {
    this.timeService.loadServerTime();
    this.loadSessionData();

    this.router.events.subscribe(async () => {
      const isMobile = await firstValueFrom(this.isHandset$);

      if (isMobile && this.drawer?.opened) {
        this.drawer.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
  }

  private loadSessionData(): void {
    const profile = this.tokenService.getUserProfile();

    this.userFullName = profile?.fullName || profile?.firstName || 'Usuario';
    this.userUsername = profile?.username || '';
    this.userEmail = profile?.email || '';

    // 🔹 Roles del usuario
    const roles = this.tokenService.getUserRoles();

    if (!roles) {
      this.userRoles = [];
    } else if (Array.isArray(roles)) {
      this.userRoles = roles;
    } else {
      this.userRoles = [roles];
    }

    // 🔹 Decodificar token
    const token = this.tokenService.getAccessToken();

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.decodedToken = payload;
        console.log('🔎 Token decodificado:', payload);
      } catch (e) {
        console.error('Error decodificando token', e);
      }
    }

    // 🔹 Recuperar rol activo guardado
    const savedRole = sessionStorage.getItem('activeRole');

    if (savedRole && this.userRoles.includes(savedRole)) {
      this.activeRole = savedRole;
    } else if (this.userRoles.length === 1) {
      // ✔ si solo tiene un rol se asigna automático
      this.activeRole = this.userRoles[0];
    } else {
      // ✔ más de un rol → esperar selección
      this.activeRole = null;
      this.menuVisible = false;
    }

    // 🔹 guardar rol activo si existe
    if (this.activeRole) {
      sessionStorage.setItem('activeRole', this.activeRole);
      this.tokenService.setActiveRole(this.activeRole);

      this.buildMenu();
      this.menuVisible = true;
    }

    // 🔹 iniciar control de sesión
    this.sessionService.startSessionFromToken();
    this.startRealExpirationTimer();

    console.log('URL actual:', this.router.url);

    if (this.router.url === '/') {
      this.router.navigate(['inicio']);
    }
  }

  onContinue(): void {
    if (this.userRoles.length === 1) {
      this.activeRole = this.userRoles[0];
    }

    if (!this.activeRole) {
      alert('Debe seleccionar rol.');
      return;
    }

    sessionStorage.setItem('activeRole', this.activeRole);
    this.tokenService.setActiveRole(this.activeRole);

    this.buildMenu();
    this.menuVisible = true;
  }

  toggleDrawer(): void {
    this.drawer.toggle();
  }

  async navigate(route: string): Promise<void> {
    const isMobile = await firstValueFrom(this.isHandset$);

    if (isMobile) {
      await this.drawer.close();
    }

    await this.router.navigate([route]);
  }

  buildMenu(): void {
    const normalize = (r: string) => r?.trim().toUpperCase();

    const role = normalize(this.activeRole || '');

    const baseMenu: any[] = [];
    const adminMenu: any[] = [];

    const mainRoute = routes.find((r) => r.children);
    const childRoutes = mainRoute?.children ?? [];

    const processRoute = (route: any, parentPath = '') => {
      if (!route.path || route.redirectTo) return;

      const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path;

      const allowedRoles = route.data?.['roles'] ?? [];

      const visible =
        allowedRoles.length === 0 ||
        allowedRoles.some((r: string) => normalize(r) === role);

      if (visible && !route.children && !route.data?.hidden) {
        const item = {
          title: route.data?.title || route.path,
          icon: route.data?.icon || 'chevron_right',
          route: '/' + fullPath,
        };

        if (fullPath.startsWith('admin/')) {
          adminMenu.push(item);
        } else {
          baseMenu.push(item);
        }
      }

      // 🔥 recorrer hijos
      if (route.children) {
        for (const child of route.children) {
          processRoute(child, fullPath);
        }
      }
    };

    for (const route of childRoutes) {
      processRoute(route);
    }

    this.menuItems = baseMenu;
    this.mantenedorItems = adminMenu;
  }

  async extendSession(): Promise<void> {
    if (this.isRefreshing) return;

    this.isRefreshing = true;

    try {
      const response: any = await firstValueFrom(this.auth.refresh());

      console.log('🔄 Sesión renovada', response);

      // 💥 GUARDAR TOKENS CORRECTOS
      this.tokenService.setAccessToken(response.token);
      this.tokenService.setRefreshToken(response.refreshToken);

      // 💥 ACTUALIZAR EXPIRACIÓN
      this.tokenService.setExpirationFromToken(response.token);

      // reiniciar sesión
      this.sessionService.startSessionFromToken();

      this.timerSub?.unsubscribe();
      this.startRealExpirationTimer();

      this.snackBar.open('Sesión extendida', '', {
        duration: 2000,
      });
    } catch (error) {
      console.warn('⚠️ Refresh falló, cerrando sesión');

      this.timerSub?.unsubscribe();
      this.tokenService.clear();

      this.router.navigate(['/auth/login']);
    } finally {
      this.isRefreshing = false;
    }
  }

  startRealExpirationTimer(): void {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
    }

    const calculate = () => {
      const exp = this.tokenService.getTokenExpiration();

      if (!exp) return;

      const remainingMs = exp - Date.now();

      this.remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));

      this.showExtendButton = this.remainingMinutes <= 5;

      console.log('⏱ Minutos restantes:', this.remainingMinutes);

      // 🔴 SI YA VENCIO
      if (remainingMs <= 0) {
        console.warn('⚠️ Token vencido');

        this.timerSub?.unsubscribe();
        this.tokenService.clear();

        this.router.navigate(['/auth/login']);
        return;
      }
      this.cdr.detectChanges();
    };

    calculate();

    this.timerSub = interval(60000).subscribe(() => {
      calculate();
    });
  }

  logout(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: 'Salir del Sistema',
          message: '¿Está seguro que desea salir?',
          confirmText: 'Salir',
          cancelText: 'Volver',
          icon: 'logout',
          color: 'warn',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.timerSub?.unsubscribe();
          this.tokenService.clear();
          this.router.navigate(['/auth/login']);
        }
      });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
