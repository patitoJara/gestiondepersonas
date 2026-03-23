// src\app\telework\services\auth.login.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

import { AuthResponse } from '../models/auth-response.model';
import { TokenService } from '@app/core/services/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthLoginService {
  private api = environment.authUrl;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  // ==========================================================
  // 🔐 LOGIN
  // ==========================================================
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, { email, password })
      .pipe(
        tap((res) => {
          if (!res?.token) {
            throw new Error('Respuesta inválida de login');
          }

          // 🔥 Guardar tokens
          this.tokenService.setTokens(res.token, res.refreshToken);

          console.log('[Auth] ✅ Login correcto');
        })
      );
  }

  // ==========================================================
  // 🔁 REFRESH TOKEN
  // ==========================================================
  refresh(): Observable<AuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();

    return this.http
      .post<AuthResponse>(`${this.api}/refresh`, { refreshToken })
      .pipe(
        tap((res) => {
          if (!res?.token) {
            throw new Error('Respuesta inválida al refrescar token');
          }

          const newRefresh = res.refreshToken ?? refreshToken;

          this.tokenService.setTokens(res.token, newRefresh);

          console.log('[Auth] 🔄 Token refrescado');
        })
      );
  }

  // ==========================================================
  // 🚪 LOGOUT
  // ==========================================================
  logout(): void {
    this.tokenService.clear();

    console.log('[Auth] 🔒 Logout');
    window.location.href = '/auth/login';
  }

  // ==========================================================
  // 🧩 TOKEN
  // ==========================================================
  getToken(): string | null {
    return this.tokenService.getAccessToken();
  }
}