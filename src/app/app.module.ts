// ✅ src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// 🔹 Interceptores funcionales modernos
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';

// 📅 Angular Material — formato de fechas (Chile)
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

// 🔹 Formatos de fecha personalizados (Chile - dd/MM/yyyy)
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    // 🚀 Rutas principales
    provideRouter(routes),

    // 🎞️ Animaciones de Angular Material
    provideAnimations(),

    // 🌐 HTTP + interceptores funcionales
    provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor])),

    // 🌎 Configuración global de fechas (Chile)
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
};
