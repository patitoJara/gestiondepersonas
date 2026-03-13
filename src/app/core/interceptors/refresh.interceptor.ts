// C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\core\interceptors\refresh.interceptor.ts

/*
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthLoginService } from '../../services/auth.login.service';
import { TokenService } from '../../core/services/token.service';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthLoginService);
  const tokenService = inject(TokenService);

  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap((newToken) => {
          if (!newToken) {
            return throwError(() => error);
          }

          tokenService.setAccessToken(newToken);

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            })
          );
        })
      );
    })
  );
};
*/