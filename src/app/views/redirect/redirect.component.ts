// src/app/views/redirect/redirect.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationStateService } from '@app/core/services/navigation-state.service';

@Component({
  standalone: true,
  template: '',
})
export class RedirectComponent implements OnInit {
  private router = inject(Router);
  private navState = inject(NavigationStateService);

  ngOnInit(): void {
    const last = this.navState.getLastRoute();

    // 🛡️ Blindaje total
    if (!last || last === '/' || last === '') {
      this.navState.clear();
      this.router.navigateByUrl('/inicio', { replaceUrl: true });
      return;
    }

    this.router.navigateByUrl(last, { replaceUrl: true });
  }
}
