// src/app/core/interceptors/auth.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
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

import { TokenService } from '@app/core/services/token.service';
import { AuthLoginService } from '@app/core/auth/services/auth.login.service';
import { AuthResponse } from '@app/core/auth/models/auth-response.model';

let isRefreshing = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthLoginService);

  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/time/server');

  if (isAuthRequest) {
    return next(req);
  }

  const isDocumentDownload =
    req.url.includes('/wellbeing/postulations/documents/') &&
    req.url.includes('/download');

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

      console.warn('[AuthInterceptor] 401 detectado:', {
        url: req.url,
        isDocumentDownload,
        status: error.status,
      });

      /**
       * Importante:
       * Si falla la descarga de un documento con 401,
       * NO se debe cerrar la sesión completa.
       * Dejamos que el componente muestre el mensaje:
       * "Archivo físico no disponible".
       */
      if (isDocumentDownload) {
        return throwError(() => error);
      }

      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        console.warn('[AuthInterceptor] No hay refreshToken disponible');
        authService.logout();
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshSubject.pipe(
          filter((newToken): newToken is string => newToken !== null),
          take(1),
          switchMap((newToken) => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });

            return next(retryReq);
          }),
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      return authService.refresh().pipe(
        switchMap((res: AuthResponse) => {
          const newAccessToken = res?.token;

          if (!newAccessToken) {
            authService.logout();
            return throwError(() => error);
          }

          refreshSubject.next(newAccessToken);

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          return next(retryReq);
        }),

        catchError((refreshError) => {
          refreshSubject.next(null);
          authService.logout();
          return throwError(() => refreshError);
        }),

        finalize(() => {
          isRefreshing = false;
        }),
      );
    }),
  );
};