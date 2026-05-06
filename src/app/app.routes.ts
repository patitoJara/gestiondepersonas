import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { TemplateComponent } from './layout/template/template.component';
import { AboutPublicComponent } from './public/about/about-public/about-public.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // =====================================================
  // 🔁 REDIRECCIÓN INICIAL
  // =====================================================
  { path: '', redirectTo: 'gestion-personas', pathMatch: 'full' },

  // =====================================================
  // 🔐 AUTH
  // =====================================================
  { path: 'auth/login', component: LoginComponent },

  {
    path: 'auth/recover',
    loadComponent: () =>
      import('./core/auth/recover/recover.component').then(
        (m) => m.RecoverComponent,
      ),
  },

  {
    path: 'auth/change-password',
    loadComponent: () =>
      import('./core/auth/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent,
      ),
  },

  // =====================================================
  // 🌍 PUBLICO
  // =====================================================
  { path: 'about-public', component: AboutPublicComponent },

  // =====================================================
  // 🔥 SISTEMA (ÚNICO)
  // =====================================================
  {
    path: 'gestion-personas',
    component: TemplateComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      // =====================================================
      // 🟦 TELETRABAJO (MAIN)
      // =====================================================

      {
        path: 'inicio',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/inicio/inicio.component').then(
            (m) => m.InicioComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'main',
          title: 'Inicio',
          icon: 'home',
          roles: ['ADMIN', 'SUPERVISOR', 'ADMINISTRATIVO', 'JEFATURA'],
          iconColor: '#2e7d32', // verde
        },
      },

      {
        path: 'registro-jornada',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'main',
          title: 'Registro de jornada',
          icon: 'access_time',
          roles: ['ADMIN', 'ADMINISTRATIVO'],
          iconColor: '#2e7d32', // verde
        },
      },

      {
        path: 'mi-reporte',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/reports/telework-report-user/telework-report-user.component').then(
            (m) => m.TeleworkReportUserComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'main',
          title: 'Mi Control de Teletrabajo',
          icon: 'assignment_ind',
          roles: ['ADMIN', 'ADMINISTRATIVO'],
          iconColor: '#2e7d32', // verde
        },
      },

      {
        path: 'mis-suscripciones',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/reports/telework-subscriptions/telework-subscriptions.component').then(
            (m) => m.TeleworkUserSubscriptionsComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'main',
          title: 'Mis Suscripciones',
          icon: 'event',
          roles: ['ADMIN', 'ADMINISTRATIVO'],
          iconColor: '#2e7d32', // verde
        },
      },

      {
        path: 'mis-funcionarios',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/admin/jefaturas/jefatura-usuarios.component').then(
            (m) => m.JefaturaUsuariosComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'admin',
          title: 'Funcionarios por Jefatura',
          icon: 'groups',
          roles: ['ADMIN', 'JEFATURA'],
          iconColor: '#ef6c00', // naranjo
        },
      },

      {
        path: 'mi-reporte-jefatura',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/reports/telework-report-jefatura/telework-report-jefatura.component').then(
            (m) => m.TeleworkReportJefaturaComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'main',
          title: 'Reporte Jefatura',
          icon: 'assessment',
          roles: ['ADMIN', 'JEFATURA'],
          iconColor: '#ef6c00', // naranjo
        },
      },

      // =====================================================
      // 🟧 TELETRABAJO (ADMIN)
      // =====================================================

      {
        path: 'users-groups',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/admin/users-groups/users-groups.component').then(
            (m) => m.UsersGroupsComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'admin',
          title: 'Auditoría de Grupos',
          icon: 'groups',
          roles: ['ADMIN', 'SUPERVISOR'],
          iconColor: '#1565c0', //azul
        },
      },

      {
        path: 'report',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/reports/telework-report/telework-report.component').then(
            (m) => m.TeleworkReportComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'main',
          title: 'Auditoría Teletrabajo',
          icon: 'assessment',
          roles: ['ADMIN', 'SUPERVISOR'],
          iconColor: '#1565c0', //azul
        },
      },

      {
        path: 'admin/subscribe',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/admin/subscribe/telework-subscribe.component').then(
            (m) => m.TeleworkSubscribeComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'admin',
          title: 'Suscripción Teletrabajo',
          icon: 'event',
          roles: ['ADMIN', 'SUPERVISOR'],
          iconColor: '#1565c0', //azul
        },
      },

      {
        path: 'admin/usuarios',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/admin/usuarios/users.component').then(
            (m) => m.UsuariosComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'admin',
          title: 'Usuarios',
          icon: 'person',
          roles: ['ADMIN', 'SUPERVISOR'],
          iconColor: '#1565c0', //azul
        },
      },

      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/admin/roles/roles.component').then(
            (m) => m.RolesComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'admin',
          title: 'Roles',
          icon: 'security',
          roles: ['ADMIN'],
          iconColor: '#bb3540', //rojo
        },
      },
      {
        path: 'admin/tools/users',
        loadComponent: () =>
          import('./modules/gestion-personas/admin/user-maintenance/user-maintenance.component').then(
            (m) => m.UserMaintenanceComponent,
          ),

        data: {
          module: 'teletrabajo',
          section: 'admin',
          title: 'Conf. General',
          icon: 'security',
          roles: ['ADMIN'], // ✅ CORRECTO
          iconColor: '#bb3540', // 🔥 ahora sí funciona
        },
      },

      {
        path: 'manual',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/manual/manual.component').then(
            (m) => m.ManualComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'main',
          title: 'Manual',
          icon: 'menu_book',
          roles: ['ADMIN', 'SUPERVISOR', 'ADMINISTRATIVO', 'JEFATURA'],
          iconColor: '#2e7d32', // verde
        },
      },

      {
        path: 'about',
        loadComponent: () =>
          import('./modules/gestion-personas/teletrabajo/views/about-private/about-private.component').then(
            (m) => m.AboutPrivateComponent,
          ),
        data: {
          module: 'teletrabajo',
          section: 'main',
          title: 'Acerca del sistema',
          icon: 'info',
          roles: ['ADMIN', 'SUPERVISOR', 'ADMINISTRATIVO', 'JEFATURA'],
          iconColor: '#2e7d32', // verde
        },
      },

      // =====================================================
      // 🟩 BENEFICIOS
      // =====================================================

      {
        path: 'bienestar',
        loadComponent: () =>
          import('./modules/gestion-personas/beneficios/postulacion-estudios/postulation-form.component').then(
            (m) => m.PostulationFormComponent,
          ),
        data: {
          module: 'beneficios',
          group: 'Postulación', // 🔥 ESTE ES EL CAMBIO
          title: 'Postulación Estudios',
          icon: 'school',
          //roles: ['ADMIN', 'SUPERVISOR', 'ADMINISTRATIVO', 'JEFATURA'],
          roles: ['ADMIN', 'JEFATURA', 'SUPERVISOR', 'POSTULACION'],
          iconColor: '#2e7d32', // verde
        },
      },      
    ],
  },

  // 👤 PERFIL (OCULTO)
  {
    path: 'profile',
    loadComponent: () =>
      import('./modules/gestion-personas/teletrabajo/views/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
    data: { hidden: true },
  },
  // =====================================================
  // ❌ FALLBACK
  // =====================================================

  { path: '**', redirectTo: 'auth/login' },
];
