import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
} from 'rxjs';

import { TokenService } from '../../core/services/token.service';
import { AuthLoginService } from '@app/core/auth/services/auth.login.service';
import { Router } from '@angular/router';

let isRefreshing = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthLoginService);
  const router = inject(Router);

  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/register');

  if (isAuthRequest) {
    return next(req);
  }

  const token = tokenService.getAccessToken();

  if (!token) {
    console.warn('🚨 NO HAY TOKEN');
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      console.warn('⚠️ 401 detectado');

      const isRefreshRequest = req.url.endsWith('/auth/refresh');

      // 🔒 ANTI-LOOP REFRESH
      if (isRefreshRequest) {
        console.warn('⛔ Refresh falló → logout forzado');

        isRefreshing = false;
        refreshSubject.next(null); // 🔥 faltaba esto

        tokenService.clear();
        sessionStorage.removeItem('allowRefresh');
        router.navigate(['/auth/login']);

        return throwError(() => error);
      }

      // 🔥 CONTROL DE EXTENSIÓN MANUAL
      //const allowRefresh = localStorage.getItem('allowRefresh');
      const allowRefresh = sessionStorage.getItem('allowRefresh');

      if (!allowRefresh) {
        console.warn('⛔ Refresh bloqueado (usuario no autorizó)');

        isRefreshing = false;
        refreshSubject.next(null);

        tokenService.clear();
        router.navigate(['/auth/login']);

        return throwError(() => error);
      }

      console.warn('🔓 Refresh permitido');

      // 🔁 SI YA HAY REFRESH EN CURSO
      if (isRefreshing) {
        return refreshSubject.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((newToken) => {
            const retryReq = authReq.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(retryReq);
          }),
        );
      }

      // 🔄 INICIAR REFRESH
      isRefreshing = true;
      refreshSubject.next(null);

      return authService.refresh().pipe(
        switchMap((response: any) => {
          const newToken = response?.token;
          const newRefreshToken = response?.refreshToken;

          if (!newToken) {
            console.error('❌ Refresh inválido');

            tokenService.clear();
            isRefreshing = false;
            sessionStorage.removeItem('allowRefresh');

            router.navigate(['/auth/login']);

            return throwError(() => error);
          }

          console.log('🔄 TOKEN REFRESCADO OK');

          tokenService.setTokens(newToken, newRefreshToken);

          isRefreshing = false;
          refreshSubject.next(newToken);

          // 🔥 LIMPIAR FLAG
          sessionStorage.removeItem('allowRefresh');

          const retryReq = authReq.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          return next(retryReq);
        }),

        catchError((refreshError) => {
          console.error('❌ ERROR EN REFRESH', refreshError);

          isRefreshing = false;
          tokenService.clear();
          sessionStorage.removeItem('allowRefresh');

          router.navigate(['/auth/login']);

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
