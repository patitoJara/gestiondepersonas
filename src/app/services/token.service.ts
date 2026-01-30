//C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\services\token.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_KEY = 'refreshToken';
  private readonly ACTIVE_PROGRAM_KEY = 'activeProgram';
  private readonly ACTIVE_ROLE_KEY = 'activeRole';
  private readonly EXPIRES_AT_KEY = 'token_expires_at';

  // BehaviorSubjects
  private activeProgram$ = new BehaviorSubject<string | null>(
    sessionStorage.getItem(this.ACTIVE_PROGRAM_KEY),
  );

  private activeRole$ = new BehaviorSubject<string | null>(
    sessionStorage.getItem(this.ACTIVE_ROLE_KEY),
  );

  activeProgramChanges = this.activeProgram$.asObservable();
  activeRoleChanges = this.activeRole$.asObservable();

  // =====================================================
  // 🔑 TOKENS SOLO EN sessionStorage
  // =====================================================
  setTokens(token: string, refreshToken: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.REFRESH_KEY, refreshToken);

    console.log('[TokenService] 💾 Tokens guardados en sessionStorage');
  }

  getUserId(): number | null {
    const profile = this.getUserProfile();
    const id = Number(profile?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  /*
  getAccessToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
  */

  // =====================================================
  // 🔑 ACCESS TOKEN
  // =====================================================
  getAccessToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    console.log('[TokenService] 🔄 Access token actualizado');
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_KEY);
  }

  clear(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.ACTIVE_PROGRAM_KEY);
    sessionStorage.removeItem(this.ACTIVE_ROLE_KEY);
  }

  // =====================================================
  // ⏰ EXPIRACIÓN REAL (FRONTEND)
  // =====================================================

  // =====================================================
  // ⏰ EXPIRACIÓN DESDE JWT (FUENTE ÚNICA DE VERDAD)
  // =====================================================
  setExpirationFromToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expSeconds = payload.exp;

      if (!expSeconds) {
        console.error('[TokenService] ❌ Token sin exp');
        return;
      }

      const expiresAtMs = expSeconds * 1000;

      sessionStorage.setItem(this.EXPIRES_AT_KEY, expiresAtMs.toString());

      console.log(
        '[TokenService] ⏰ Expiración tomada desde JWT:',
        new Date(expiresAtMs),
      );
    } catch (e) {
      console.error('[TokenService] ❌ Error leyendo exp del token', e);
    }
  }

  getTokenExpiration(): number | null {
    const v = sessionStorage.getItem(this.EXPIRES_AT_KEY);
    return v ? Number(v) : null;
  }

  // =====================================================
  // 👤 PERFIL
  // =====================================================
  getUserProfile(): any | null {
    const p = sessionStorage.getItem('profile');
    return p ? JSON.parse(p) : null;
  }

  getUserRoles(): string[] {
    return JSON.parse(sessionStorage.getItem('roles') || '[]');
  }

  getUserPrograms(): string[] {
    return JSON.parse(sessionStorage.getItem('programs') || '[]');
  }

  // =====================================================
  // 🧭 PROGRAMA ACTIVO
  // =====================================================
  getActiveProgram(): string | null {
    return sessionStorage.getItem(this.ACTIVE_PROGRAM_KEY);
  }

  setActiveProgram(program: string): void {
    sessionStorage.setItem(this.ACTIVE_PROGRAM_KEY, program);
    this.activeProgram$.next(program);
  }

  // =====================================================
  // 🎭 ROL ACTIVO
  // =====================================================
  getActiveRole(): string | null {
    return sessionStorage.getItem(this.ACTIVE_ROLE_KEY);
  }

  setActiveRole(role: string): void {
    sessionStorage.setItem(this.ACTIVE_ROLE_KEY, role);
    this.activeRole$.next(role);
  }
}
