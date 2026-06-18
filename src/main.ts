// ✅ src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';

import * as moment from 'moment';
import 'moment/locale/es';

import { environment } from './environments/environment';

// 🔇 Silenciar logs cuando enableDebugTools = false
if (!environment.enableDebugTools) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};

  // Dejamos console.error activo para errores reales.
  // console.error = () => {};
}

// 🔑 Locale Angular + Moment
registerLocaleData(localeEsCL);
moment.locale('es');

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    const splash = document.querySelector('app-splash');

    if (splash) {
      setTimeout(() => splash.classList.add('hide'), 1800);
      setTimeout(() => splash.remove(), 2500);
    }
  })
  .catch((err) => console.error(err));