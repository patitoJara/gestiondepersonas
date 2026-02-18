// src/app/core/interceptors/auth.interceptor.ts

import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
} from 'rxjs';
import { TokenService } from '../../services/token.service';
import { AuthLoginService } from '../../services/auth.login.service';

let isRefreshing = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

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
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // 🚫 Si ya estamos refrescando, esperar
      if (isRefreshing) {
        return refreshSubject.pipe(
          filter((token) => token !== null),
          take(1),
          switchMap((newToken) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          }),
        );
      }

      // 🔒 Iniciar refresh único
      isRefreshing = true;
      refreshSubject.next(null);

      return authService.refresh().pipe(
        switchMap((response: any) => {
          const newToken = response?.token;

          if (!newToken) {
            tokenService.clear();
            return throwError(() => error);
          }

          tokenService.setAccessToken(newToken);

          isRefreshing = false;
          refreshSubject.next(newToken);

          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });

          return next(retryReq);
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          tokenService.clear();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
