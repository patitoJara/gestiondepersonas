// src/app/core/interceptors/loader.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);

  let showLoader = true;

  // ⏱️ Delay inteligente
  const timeout = setTimeout(() => {
    if (showLoader) {
      loader.show();
    }
  }, 300); // 👈 AJUSTABLE (200–400ms ideal)

  return next(req).pipe(
    finalize(() => {
      showLoader = false;
      clearTimeout(timeout);
      loader.hide();
    })
  );
};
