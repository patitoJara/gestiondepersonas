import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
  finalize,
} from 'rxjs';

import { TokenService } from '../../core/services/token.service';
import { AuthLoginService } from '@app/core/auth/services/auth.login.service';

// 🔓 Rutas públicas (NO pasan por interceptor)
const PUBLIC_URLS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
  '/users/recover-password',
];

// 🔁 Control refresh concurrente
let isRefreshing = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

// 🧠 Para evitar loop infinito
const RETRY = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthLoginService);

  const isPublic = PUBLIC_URLS.some((url) => req.url.includes(url));

  // 🚫 No tocar endpoints públicos
  if (isPublic) {
    return next(req);
  }

  const token = tokenService.getAccessToken();

  // ⚠️ Si no hay token, deja pasar (no romper flujo)
  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 🔁 evitar retry infinito
      if (req.context.get(RETRY)) {
        console.warn('🔁 Retry fallido → logout lógico');
        tokenService.clear();
        return throwError(() => error);
      }

      // 🌐 errores de red o CORS (NO hacer refresh)
      if (error.status === 0) {
        console.error('🌐 Error de red o CORS');
        return throwError(() => error);
      }

      // ❌ no es 401 → no hacer nada
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const isRefreshRequest = req.url.includes('/auth/refresh');

      // 💣 si falló el refresh → cerrar sesión
      if (isRefreshRequest) {
        isRefreshing = false;
        refreshSubject.next(null);
        tokenService.clear();
        return throwError(() => error);
      }

      // 🔄 si ya hay refresh en curso → esperar
      if (isRefreshing) {
        return refreshSubject.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((newToken) => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
              context: req.context.set(RETRY, true),
            });
            return next(retryReq);
          }),
        );
      }

      // 🚀 iniciar refresh
      isRefreshing = true;
      refreshSubject.next(null);

      return authService.refresh().pipe(
        switchMap((response: any) => {
          const newToken = response?.token;
          const newRefreshToken = response?.refreshToken;

          if (!newToken) {
            refreshSubject.next(null);
            tokenService.clear();
            return throwError(() => error);
          }

          // 💾 guardar tokens nuevos
          tokenService.setTokens(newToken, newRefreshToken);

          // 🔔 liberar requests en espera
          refreshSubject.next(newToken);

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
            context: req.context.set(RETRY, true),
          });

          return next(retryReq);
        }),

        catchError((refreshError) => {
          console.error('❌ Refresh falló → logout');
          refreshSubject.next(null); // 🔥 libera a los que esperan
          isRefreshing = false; // 🔥 por si acaso (además del finalize)
          tokenService.clear();
          authService.logout?.(); // opcional si tienes método de logout
          return throwError(() => refreshError);
        }),

        finalize(() => {
          isRefreshing = false;
        }),
      );
    }),
  );
};
