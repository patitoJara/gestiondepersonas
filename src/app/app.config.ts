import { ApplicationConfig, LOCALE_ID, ErrorHandler } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';

import { GlobalErrorHandler } from './core/handlers/global-error.handler';

import {
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';

export const MY_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    // =====================================
    // 🔥 ERROR HANDLER GLOBAL
    // =====================================

    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },

    // =====================================
    // 🔥 LOCALE
    // =====================================

    { provide: LOCALE_ID, useValue: 'es-CL' },

    // =====================================
    // 🔥 ROUTER
    // =====================================

    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),

    // =====================================
    // 🔥 ANIMATIONS
    // =====================================

    provideAnimations(),

    // =====================================
    // 🔥 HTTP + INTERCEPTORS
    // =====================================

    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loaderInterceptor,
      ]),
    ),

    // =====================================
    // 🔥 DATEPICKER NATIVO
    // =====================================

    provideNativeDateAdapter(),

    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },

    // =====================================
    // 🔥 CHARTS
    // =====================================

    provideCharts(withDefaultRegisterables()),
  ],
};