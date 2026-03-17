import { Routes } from '@angular/router';
import { LoginComponent } from './telework/views/auth/login/login.component';
import { TemplateComponent } from './layout/template/template.component';
import { AboutPublicComponent } from './telework/views/public/about/about-public/about-public.component';
import { TeleworkSubscribeComponent } from './telework/views/admin/subscribe/telework-subscribe.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'auth/login', component: LoginComponent },

  { path: 'about-public', component: AboutPublicComponent },

  {
    path: '',
    component: TemplateComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },

      {
        path: 'inicio',
        loadComponent: () =>
          import('./telework/views/inicio/inicio.component').then(
            (m) => m.InicioComponent,
          ),
        data: {
          roles: ['ADMIN', 'SUPERVISOR', 'ADMINISTRATIVO'],
          title: 'Inicio',
          icon: 'home',
        },
      },

      {
        path: 'registro-jornada',
        loadComponent: () =>
          import('./telework/views/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
        data: {
          roles: ['ADMIN', 'SUPERVISOR', 'ADMINISTRATIVO'],
          title: 'Registro de jornada',
          icon: 'access_time',
        },
      },

      {
        path: 'report',
        loadComponent: () =>
          import('./telework/views/reports/telework-report/telework-report.component').then(
            (m) => m.TeleworkReportComponent,
          ),
        data: {
          roles: ['ADMIN', 'SUPERVISOR'],
          title: 'Reporte Telework',
          icon: 'assessment',
        },
      },

      {
        path: 'manual',
        loadComponent: () =>
          import('./telework/views/manual/manual.component').then(
            (m) => m.ManualComponent,
          ),
        data: {
          roles: ['ADMIN', 'SUPERVISOR', 'ADMINISTRATIVO'],
          title: 'Manual',
          icon: 'menu_book',
        },
      },

      {
        path: 'about',
        loadComponent: () =>
          import('./telework/views/public/about/about-private/about-private.component').then(
            (m) => m.AboutPrivateComponent,
          ),
        data: {
          roles: ['ADMIN', 'SUPERVISOR', 'ADMINISTRATIVO'],
          title: 'Acerca del sistema',
          icon: 'info',
        },
      },

      /* ADMIN */

      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./telework/views/admin/roles/roles.component').then(
            (m) => m.RolesComponent,
          ),
        data: {
          roles: ['ADMIN'],
          title: 'Roles',
          icon: 'security',
        },
      },

      {
        path: 'admin/usuarios',
        loadComponent: () =>
          import('./telework/views/admin/usuarios/users.component').then(
            (m) => m.UsuariosComponent,
          ),
        data: {
          roles: ['ADMIN'],
          title: 'Usuarios',
          icon: 'person',
        },
      },

      {
        path: 'admin/subscribe',
        loadComponent: () =>
          import('./telework/views/admin/subscribe/telework-subscribe.component').then(
            (m) => m.TeleworkSubscribeComponent,
          ),
        data: {
          roles: ['ADMIN', 'SUPERVISOR'],
          title: 'Suscripciones',
          icon: 'event',
        },
      },

      {
        path: 'admin/vpn',
        loadComponent: () =>
          import('./telework/views/admin/vpn/vpn.component').then(
            (m) => m.VpnComponent,
          ),
        data: {
          roles: ['ADMIN'],
          title: 'VPN',
          icon: 'vpn_key',
        },
      },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
