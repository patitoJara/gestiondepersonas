// src/app/core/interceptors/auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '../../services/token.service';
import { AuthLoginService } from '../../services/auth.login.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthLoginService);

  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/register');

  if (isAuthRequest) {
    return next(req);
  }

  const token = tokenService.getAccessToken();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // 🔄 USAR refresh EXISTENTE
      return authService.refresh().pipe(
        switchMap(() => {
          const newToken = tokenService.getAccessToken();

          if (!newToken) {
            return throwError(() => error);
          }

          // 🔁 REINTENTO ÚNICO
          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            }),
          );
        }),
      );
    }),
  );
};
