// ============================================================
// ✅ AUTH LOGIN SERVICE
// Maneja autenticación, tokens, perfil, roles y refresh
// ============================================================
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';
import { map, tap, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

// ------------------------------------------------------------
// 🧩 Interfaces exportadas
// ------------------------------------------------------------
export interface AuthProfile {
  username: string;
  email: string;
  id: number;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  roles: Array<{ id: number; name: string }>;
  programs: string[];
  profile: AuthProfile;
}

// ------------------------------------------------------------
// 🧠 Servicio principal
// ------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class AuthLoginService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private readonly BASE_URL = environment.BaseUrl;

  private roles: string[] = [];
  private programs: string[] = [];
  private profile: AuthProfile | null = null;

  // ==========================================================
  // 🔐 LOGIN
  // ==========================================================
  login(email: string, password: string): Observable<AuthResponse> {
    const url = `${this.BASE_URL}/auth/login`;

    return this.http.post<AuthResponse>(url, { email, password }).pipe(
      tap((res) => {
        if (!res || !res.token) throw new Error('Respuesta de login inválida.');

        console.log('[AuthLoginService] 🧩 Respuesta login completa:', res);

        this.tokenService.setExpirationFromToken(res.token);

        const accessToken = res.token;
        const refreshToken = res.refreshToken;

        // Guarda tokens
        //this.tokenService.setTokens(accessToken, refreshToken, true);
        this.tokenService.setTokens(accessToken, refreshToken);

        // Guarda manualmente por compatibilidad
        //localStorage.setItem('token', accessToken);
        //if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        // ---------------------------------------------------------
        // 🟦 GUARDAR ROLES, PROGRAMAS Y PERFIL EN SESSIONSTORAGE
        // ---------------------------------------------------------
        this.roles = (res.roles || []).map((r) => r.name);
        this.programs = res.programs || [];
        this.profile = res.profile || null;

        sessionStorage.setItem('roles', JSON.stringify(this.roles));
        sessionStorage.setItem('programs', JSON.stringify(this.programs));
        sessionStorage.setItem('profile', JSON.stringify(this.profile));

        console.log('[AuthLoginService] 💾 Roles/Programas/Profile guardados.');
        console.log('[AuthLoginService] ✅ Tokens almacenados correctamente.');
      }),

      catchError((err) => {
        console.error('[AuthLoginService] ❌ Error de login:', err);
        return throwError(() => err);
      }),
    );
  }

  // ==========================================================
  // 🚪 LOGOUT
  // ==========================================================
  logout(): void {
    try {
      sessionStorage.clear();
      localStorage.clear(); // 🔥 por seguridad ante restos antiguos
      this.tokenService.clear();

      console.log('[AuthLoginService] 🔒 Sesión cerrada');
      this.router.navigateByUrl('/auth/login');
    } catch (e) {
      console.error('[AuthLoginService] ❌ Error haciendo logout:', e);
    }
  }

  // ==========================================================
  // 🧩 DATOS DE SESIÓN
  // ==========================================================
  getToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  getProfile(): AuthProfile | null {
    if (!this.profile && sessionStorage.getItem('profile')) {
      this.profile = JSON.parse(sessionStorage.getItem('profile')!);
    }
    return this.profile;
  }

  getRoles(): string[] {
    if (this.roles.length === 0 && sessionStorage.getItem('roles')) {
      this.roles = JSON.parse(sessionStorage.getItem('roles')!);
    }
    return this.roles;
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role.toUpperCase());
  }

  getPrograms(): string[] {
    if (this.programs.length === 0 && sessionStorage.getItem('programs')) {
      this.programs = JSON.parse(sessionStorage.getItem('programs')!);
    }
    return this.programs;
  }

  // ==========================================================
  // ⏰ CONTROL DE EXPIRACIÓN
  // ==========================================================
  getTokenExpiration(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload?.exp;
      if (!exp) return null;

      return exp > 9999999999 ? exp : exp * 1000;
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      let exp = payload.exp;

      if (exp > 9999999999) exp = Math.floor(exp / 1000);

      const now = Math.floor(Date.now() / 1000);
      const diff = exp - now;

      return diff <= 0;
    } catch {
      return true;
    }
  }

  // ==========================================================
  // 🔁 REFRESH TOKEN (Observable, compatible con interceptor)
  // ==========================================================
  refresh(): Observable<string> {
    console.log('[AuthLoginService] 🔄 Intentando refrescar token...');

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      console.warn('[AuthLoginService] ⚠️ No hay refreshToken disponible.');
      return throwError(() => new Error('No refresh token'));
    }

    const url = `${this.BASE_URL}/auth/refresh`;

    return this.http.post<AuthResponse>(url, { refreshToken }).pipe(
      map((res) => {
        if (!res || !res.token) {
          throw new Error('Respuesta inválida al refrescar token');
        }

        // 🔐 Guardar tokens
        this.tokenService.setTokens(res.token, res.refreshToken);

        // ⏰ CLAVE ABSOLUTA
        this.tokenService.setExpirationFromToken(res.token);

        // 🧩 Mantener sesión consistente
        sessionStorage.setItem(
          'roles',
          JSON.stringify(res.roles.map((r) => r.name)),
        );
        sessionStorage.setItem('programs', JSON.stringify(res.programs));
        sessionStorage.setItem('profile', JSON.stringify(res.profile));

        console.log('[AuthLoginService] 🔁 Token refrescado correctamente.');

        return res.token;
      }),
    );
  }
}
