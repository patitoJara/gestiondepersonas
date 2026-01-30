// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const sessionService = inject(SessionService);

  // ---------------------------------------------------------
  // 🟢 1. Si no existe token → cerrar sesión
  // ---------------------------------------------------------
  const token = tokenService.getAccessToken();

  if (!token) {
    console.warn('[AuthGuard] 🚫 No hay token → logout');
    sessionService.logout('manual');
    return false;
  }

  // ---------------------------------------------------------
  // 🔍 2. Validar expiración REAL
  // ---------------------------------------------------------
  const exp = tokenService.getTokenExpiration();

  if (!exp) {
    console.warn(
      '[AuthGuard] ❌ No se pudo obtener expiración → logout por seguridad'
    );
    sessionService.logout('manual');
    return false;
  }

  const now = Date.now();

  if (exp <= now) {
    console.warn(
      `[AuthGuard] ⛔ Token expirado → exp:${exp} <= now:${now}`
    );
    sessionService.logout('timeout');
    return false;
  }

  // ---------------------------------------------------------
  // 🟢 Token válido: permitir el acceso
  // ---------------------------------------------------------
  console.log('[AuthGuard] ✅ Token válido → Acceso permitido');
  return true;
};
