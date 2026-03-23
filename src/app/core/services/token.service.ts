// src\app\core\services\token.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_KEY = 'refreshToken';
  private readonly PROFILE_KEY = 'profile';
  private readonly ROLES_KEY = 'roles';

  private readonly ACTIVE_ROLE_KEY = 'activeRole';
  private readonly EXPIRES_AT_KEY = 'token_expires_at';

  private activeRole$ = new BehaviorSubject<string | null>(
    sessionStorage.getItem(this.ACTIVE_ROLE_KEY),
  );

  activeRoleChanges = this.activeRole$.asObservable();

  // =====================================================
  // TOKENS
  // =====================================================

  setTokens(token: string, refreshToken: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.REFRESH_KEY, refreshToken);
    this.setExpirationFromToken(token);
    console.log('[TokenService] Tokens guardados');
  }

  setAccessToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);

    // 💥 SIEMPRE recalcular exp
    this.setExpirationFromToken(token);
  }

  setRefreshToken(refreshToken: string): void {
    sessionStorage.setItem(this.REFRESH_KEY, refreshToken);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_KEY);
  }

  clear(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.PROFILE_KEY);
    sessionStorage.removeItem(this.ROLES_KEY);
    sessionStorage.removeItem(this.ACTIVE_ROLE_KEY);
    sessionStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  // =====================================================
  // EXPIRACIÓN JWT
  // =====================================================

  setExpirationFromToken(token: string, expiresIn?: number): void {
    try {
      let expiresAtMs: number | null = null;

      // 🔹 PRIORIDAD 1 → expiresIn (más preciso)
      if (expiresIn) {
        expiresAtMs = Date.now() + expiresIn;
        console.log('[TokenService] Expiración desde expiresIn');
      } else {
        // 🔹 PRIORIDAD 2 → JWT exp
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expSeconds = payload.exp;

        if (!expSeconds) return;

        expiresAtMs = expSeconds * 1000;
        console.log('[TokenService] Expiración desde JWT');
      }

      sessionStorage.setItem(this.EXPIRES_AT_KEY, expiresAtMs.toString());

      console.log('[TokenService] Expira en:', new Date(expiresAtMs));
    } catch (e) {
      console.error('Error leyendo expiración del token', e);
    }
  }
  
  getTokenExpiration(): number | null {
    const v = sessionStorage.getItem(this.EXPIRES_AT_KEY);

    return v ? Number(v) : null;
  }

  // =====================================================
  // PERFIL USUARIO
  // =====================================================

  setUserProfile(profile: any): void {
    sessionStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
  }

  getUserProfile(): any {
    const p = sessionStorage.getItem(this.PROFILE_KEY);

    return p ? JSON.parse(p) : null;
  }

  getUserId(): number | null {
    const profile = this.getUserProfile();

    const id = Number(profile?.id);

    return Number.isFinite(id) && id > 0 ? id : null;
  }

  // =====================================================
  // ROLES
  // =====================================================

  setUserRoles(roles: any[]): void {
    const roleNames = roles.map((r) => r.name);

    sessionStorage.setItem(this.ROLES_KEY, JSON.stringify(roleNames));
  }

  getUserRoles(): string[] {
    return JSON.parse(sessionStorage.getItem(this.ROLES_KEY) || '[]');
  }

  // =====================================================
  // ROL ACTIVO
  // =====================================================

  setActiveRole(role: string | null): void {
    if (role) {
      sessionStorage.setItem(this.ACTIVE_ROLE_KEY, role);
    } else {
      sessionStorage.removeItem(this.ACTIVE_ROLE_KEY);
    }

    this.activeRole$.next(role);
  }

  getActiveRole(): string | null {
    return sessionStorage.getItem(this.ACTIVE_ROLE_KEY);
  }

  getUserFullName(): string | null {
    const profile = this.getUserProfile();
    return profile?.fullName || null;
  }

  getUserRole(): string | null {
    return this.getActiveRole();
  }
}
