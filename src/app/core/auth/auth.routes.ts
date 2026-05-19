import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'recover',
    loadComponent: () =>
      import('./recover/recover.component').then((m) => m.RecoverComponent),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent
      ),
  },
];
