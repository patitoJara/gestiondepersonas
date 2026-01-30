// src/app/core/services/session.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { TokenService } from '../../services/token.service';

@Injectable({ providedIn: 'root' })
export class SessionService implements OnDestroy {
  private sessionSub?: Subscription;

  // ⏱ 60 minutos (en ms)
  private readonly SESSION_TIME = 60 * 60 * 1000;

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {}

  /**
   * Inicia o reinicia la sesión
   * Siempre mata cualquier timer anterior
   */
  startSession(source: 'login' | 'refresh' | 'reload' = 'login'): void {
    console.log(`⏲ [SessionService] Iniciando sesión desde: ${source}`);

    // 🔥 MUY IMPORTANTE: cancelar cualquier timer viejo
    this.clearSession();

    this.sessionSub = timer(this.SESSION_TIME).subscribe(() => {
      console.warn('🚨 [SessionService] Sesión expirada');
      this.logout('timeout');
    });
  }

  /**
   * Cancela el temporizador activo
   */
  clearSession(): void {
    if (this.sessionSub) {
      this.sessionSub.unsubscribe();
      this.sessionSub = undefined;
      console.log('🧹 [SessionService] Timer de sesión cancelado');
    }
  }

  /**
   * Logout centralizado
   */
  logout(reason: 'manual' | 'timeout' = 'manual'): void {
    console.log(`🚪 [SessionService] Logout ejecutado (${reason})`);

    this.clearSession();
    this.tokenService.clear();

    // ⚠️ IMPORTANTE: ruta correcta de login
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  ngOnDestroy(): void {
    this.clearSession();
  }
}
