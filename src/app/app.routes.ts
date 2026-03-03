import { Routes } from '@angular/router';
import { LoginComponent } from './views/login/login.component';
import { TemplateComponent } from './layout/template/template.component';
import { AboutPublicComponent } from './views/about/about-public/about-public.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  { path: 'auth/login', component: LoginComponent },

  { path: 'about-public', component: AboutPublicComponent },

  {
    path: '',
    component: TemplateComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./telework/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
      },
      {
        path: 'manual',
        loadComponent: () =>
          import('./telework/manual/manual.component')
            .then(m => m.ManualComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];