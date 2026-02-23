import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts'

import { authInterceptor } from './core/interceptors/auth.interceptor';
//import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';

import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

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
    // 🔑 CLAVE ABSOLUTA PARA EL MANUAL
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),

    provideAnimations(),

    provideHttpClient(
      withInterceptors([
        authInterceptor,
        //refreshInterceptor,
        loaderInterceptor,
      ]),
    ),

    provideMomentDateAdapter(),

    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },

    provideCharts(withDefaultRegisterables()),
    
  ],
};
