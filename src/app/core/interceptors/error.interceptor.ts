///C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\core\interceptors\error.interceptor.ts

import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => throwError(() => err))
  );
