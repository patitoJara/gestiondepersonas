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

  ngOnInit(): void {
    this.timeService.loadServerTime();
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
        route: '/' + route.path,

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

    sessionStorage.setItem('allowRefresh', 'true'); // 🔥 clave

    this.warned = false;
    this.isRefreshing = true;

    try {
      const response: any = await firstValueFrom(this.auth.refresh());

      this.tokenService.setAccessToken(response.token);
      this.tokenService.setRefreshToken(response.refreshToken);
      this.tokenService.setExpirationFromToken(response.token);

      this.sessionService.startSessionFromToken();

      if (this.timerSub) {
        clearInterval(this.timerSub);
        this.timerSub = undefined;
      }
      this.startRealExpirationTimer();

      this.snackBar.open('Sesión extendida', '', {
        duration: 2000,
      });
    } catch (error) {
      if (this.timerSub) {
        clearInterval(this.timerSub);
        this.timerSub = undefined;
      }
      this.tokenService.clear();

      this.router.navigate(['/auth/login']);
    } finally {
      sessionStorage.removeItem('allowRefresh');

      if (this.timerSub) {
        clearInterval(this.timerSub);
      }

      this.remainingMinutes = 60; // 🔥 clave
      this.showExtendButton = false;

      this.startRealExpirationTimer(); // 🔥 reinicia timer

      this.isRefreshing = false;
    }
  }

  startRealExpirationTimer() {
    if (this.timerSub) {
      clearInterval(this.timerSub);
    }

    this.timerSub = setInterval(() => {
      this.remainingMinutes--;

      this.showExtendButton = this.remainingMinutes <= 5;

      if (this.remainingMinutes <= 0) {
        this.forceLogout(); // 🔥 SIN modal
      }
    }, 60000);
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

    this.tokenService.clear();
    this.router.navigate(['/auth/login']);
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

  startSessionTimer() {
    const totalMinutes = 60;

    setInterval(() => {
      this.remainingMinutes--;

      // 🔥 mostrar botón cuando queden 5 min
      this.showExtendButton = this.remainingMinutes <= 5;

      // 🔥 cerrar sesión
      if (this.remainingMinutes <= 0) {
        this.logout();
      }
    }, 60000); // 1 minuto
  }

  resetSessionTimer() {
    this.remainingMinutes = 60;
    this.showExtendButton = false;
  }
}
