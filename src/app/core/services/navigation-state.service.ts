// src/app/core/services/navigation-state.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationStateService {
  private readonly KEY = 'last_route';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects;

        // ⛔ No guardar rutas inválidas
        if (
          !url ||
          url === '/' ||
          url.startsWith('/auth')
        ) {
          return;
        }

        localStorage.setItem(this.KEY, url);
      });
  }

  getLastRoute(): string | null {
    return localStorage.getItem(this.KEY);
  }

  clear(): void {
    localStorage.removeItem(this.KEY);
  }
}
