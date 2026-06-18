import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
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
import { ErrorConfirmDialogComponent } from '@app/shared/confirm-dialog/errorConfirmDialogComponent';
import { OnDestroy } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TokenService } from '@app/core/services/token.service';
import { AuthLoginService } from '@app/core/auth/services/auth.login.service';
import { SessionService } from '@app/core/services/session.service';
import { TimeService } from '@app/core/services/time.service';
import { routes } from '../../app.routes';

import { AppRouteData } from '@app/core/models/route-data.model';

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
    MatTooltipModule,
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

  private warned = false;

  private roleContinueButtonRef?: ElementRef<HTMLButtonElement>;

  @ViewChild('roleContinueButton')
  set roleContinueButton(ref: ElementRef<HTMLButtonElement> | undefined) {
    this.roleContinueButtonRef = ref;

    if (ref) {
      this.scheduleRoleButtonFocus();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleRoleButtonFocus();
  }

  private scheduleRoleButtonFocus(delay = 300): void {
    setTimeout(() => {
      this.focusRoleContinueButton();
    }, delay);
  }

  private focusRoleContinueButton(): void {
    const button = this.roleContinueButtonRef?.nativeElement;

    if (!button || this.menuVisible || this.userRoles.length <= 1) {
      return;
    }

    button.focus();

    console.log('[roles] 🎯 Foco puesto en botón INGRESAR');
  }

  remainingMinutes = 60;
  showExtendButton = false;

  isRefreshing = false;

  userFullName: string = 'Usuario';
  userUsername: string = '';
  userEmail: string = '';
  userRoles: string[] = [];
  title: string = '';
  icon: string = '';

  activeRole: string | null = null;

  decodedToken: any = null;

  menuItems: {
    teletrabajo: any[];
    beneficios: any[];
  } = {
    teletrabajo: [],
    beneficios: [],
  };

  teletrabajoOpen = true;
  beneficiosOpen = true;

  mantenedoresOpen = true;
  menuVisible = false;
  isLoading = false;

  private timerSub?: ReturnType<typeof setInterval>;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(
      map((r) => r.matches),
      shareReplay(),
    );

  async ngOnInit(): Promise<void> {
    await this.timeService.loadServerTime();

    this.loadSessionData();

    this.router.events.subscribe(async () => {
      const isMobile = await firstValueFrom(this.isHandset$);

      /*
    if (isMobile && this.drawer?.opened) {
      this.drawer.close();
    }
    */
    });
  }

  ngOnDestroy(): void {
    if (this.timerSub) {
      clearInterval(this.timerSub);
      this.timerSub = undefined; // 🔥 deja el estado limpio
    }
  }

  private getTokenExpirationMs(): number | null {
    const token = this.tokenService.getAccessToken();

    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return payload?.exp ? Number(payload.exp) * 1000 : null;
    } catch (error) {
      console.error(
        '[session] No fue posible obtener la expiración del token',
        error,
      );

      return null;
    }
  }

  private loadSessionData(): void {
    this.buildMenu();
    this.loadMenuState();
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
      this.showRoleRequiredModal();
      return;
    }

    sessionStorage.setItem('activeRole', this.activeRole);
    this.tokenService.setActiveRole(this.activeRole);

    this.buildMenu();
    this.menuVisible = true;
  }

  private showRoleRequiredModal(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: 'Rol requerido',
          message: 'Debe seleccionar un rol para continuar.',
          confirmText: 'Aceptar',
          cancelText: '',
          icon: 'warning',
          color: 'warn',
        },
      })
      .afterClosed()
      .subscribe(() => {
        this.scheduleRoleButtonFocus();
      });
  }
  toggleDrawer(): void {
    this.drawer.toggle();
  }

  async navigate(route: string, drawer?: MatSidenav) {
    await this.router.navigate([route]);

    if (drawer && window.innerWidth < 768) {
      drawer.close();
    }
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  buildMenu(): void {
    const normalize = (r: string) => r?.trim().toUpperCase();
    const role = normalize(this.activeRole || '');

    const grouped: any = {
      teletrabajo: [],
      beneficios: [],
      teletrabajoOpen: true,
      beneficiosOpen: true,
    };

    const mainRoute = routes.find((r) => r.children);
    const childRoutes = mainRoute?.children ?? [];

    for (const route of childRoutes) {
      if (!route.path || route.redirectTo) continue;

      const data = route.data as any;
      if (!data) continue;

      const allowedRoles = data.roles ?? [];

      const visible =
        role === 'ADMIN' ||
        allowedRoles.length === 0 ||
        allowedRoles.some((r: string) => normalize(r) === role);

      if (!visible || data.hidden) continue;

      const module = data.module || 'teletrabajo';
      const groupName =
        data.group || (module === 'beneficios' ? 'Postulación' : 'Operación');

      const item = {
        title: data.title || route.path,
        icon: data.icon || 'chevron_right',
        //route: '/' + route.path,
        route: '/gestion-personas/' + route.path,
        // 🔥 NUEVO
        iconColor: data.iconColor || '#1565c0',
      };

      if (!grouped[module]) grouped[module] = [];

      let group = grouped[module].find((g: any) => g.label === groupName);

      if (!group) {
        group = { label: groupName, children: [], open: true };
        grouped[module].push(group);
      }

      group.children.push(item);
    }

    this.menuItems = grouped;
  }

  async extendSession(): Promise<void> {
    if (this.isRefreshing) return;

    sessionStorage.setItem('allowRefresh', 'true');

    this.warned = false;
    this.isRefreshing = true;

    try {
      const response: any = await firstValueFrom(this.auth.refresh());

      const token = response?.token || response?.accessToken;
      const refreshToken = response?.refreshToken || response?.refresh_token;

      if (!token) {
        throw new Error('Refresh sin token válido');
      }

      this.tokenService.setAccessToken(token);

      if (refreshToken) {
        this.tokenService.setRefreshToken(refreshToken);
      }

      this.tokenService.setExpirationFromToken(token);

      this.sessionService.startSessionFromToken();

      if (this.timerSub) {
        clearInterval(this.timerSub);
        this.timerSub = undefined;
      }

      this.startRealExpirationTimer();

      this.snackBar.open('Sesión extendida automáticamente', '', {
        duration: 2000,
      });
    } catch (error) {
      if (this.timerSub) {
        clearInterval(this.timerSub);
        this.timerSub = undefined;
      }

      this.forceLogout();
    } finally {
      sessionStorage.removeItem('allowRefresh');

      this.isRefreshing = false;
      this.showExtendButton = false;
    }
  }

  startRealExpirationTimer(): void {
    if (this.timerSub) {
      clearInterval(this.timerSub);
    }

    const updateRemainingTime = () => {
      const expirationMs = this.getTokenExpirationMs();

      if (!expirationMs) {
        this.forceLogout();
        return;
      }

      /**
       * La diferencia fundamental:
       * no usamos Date.now() directamente.
       * Usamos la hora corregida por el servidor.
       */
      const remainingMs = expirationMs - this.timeService.nowMs();

      this.remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));

      this.showExtendButton =
        this.remainingMinutes > 0 && this.remainingMinutes <= 5;

      /**
       * Si quedan 5 minutos o menos, intentamos renovar automáticamente.
       * Así evitamos que el usuario quede fuera mientras está usando el sistema.
       */
      if (
        this.remainingMinutes > 0 &&
        this.remainingMinutes <= 5 &&
        !this.isRefreshing
      ) {
        this.extendSession();
        return;
      }

      if (this.remainingMinutes <= 0 && !this.warned) {
        this.warned = true;

        if (this.timerSub) {
          clearInterval(this.timerSub);
          this.timerSub = undefined;
        }

        this.showSessionExpiredModal();
      }
    };

    /**
     * Ejecutar inmediatamente para no esperar el primer intervalo.
     */
    updateRemainingTime();

    /**
     * Recalcular cada 15 segundos.
     * No se limita a restar un minuto artificialmente.
     */
    this.timerSub = setInterval(() => {
      updateRemainingTime();
    }, 15000);
  }

  showSessionExpiredModal(): void {
    this.dialog
      .open(ErrorConfirmDialogComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: 'Sesión expirada',
          message:
            'Tu sesión ha expirado por seguridad. Debes volver a iniciar sesión.',
          confirmText: 'Volver al login',
          color: 'warn',
          icon: 'warning',
          dense: true,
        },
      })
      .afterClosed()
      .subscribe(() => {
        this.forceLogout();
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
        // 🔴 CONFIRMA → logout real
        if (ok) {
          this.forceLogout();
        }

        // 🟢 CANCELA → seguir con 5 min
        else {
          console.log('🔁 Usuario decide continuar');

          if (this.remainingMinutes <= 0) {
            this.remainingMinutes = 5;
          }

          this.showExtendButton = true;

          if (this.timerSub) {
            clearInterval(this.timerSub);
          }

          this.startRealExpirationTimer();
        }
      });
  }

  forceLogout(): void {
    if (this.timerSub) {
      clearInterval(this.timerSub);
      this.timerSub = undefined;
    }

    sessionStorage.removeItem('allowRefresh');
    this.isRefreshing = false;
    this.warned = false;

    this.sessionService.logout('manual');
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  toggleGroup(group: any) {
    group.open = !group.open;
    this.saveMenuState();
  }

  saveMenuState() {
    sessionStorage.setItem('menu_state', JSON.stringify(this.menuItems));
  }

  loadMenuState() {
    const saved = sessionStorage.getItem('menu_state');
    if (saved) {
      this.menuItems = JSON.parse(saved);
    }
  }

  isActive(route: string): boolean {
    return this.router.url.split('?')[0] === route;
  }
}
