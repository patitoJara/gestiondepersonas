import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

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

  login(email: string, password: string): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(`${this.api}/login`, {
      email,
      password
    });

  }

  refresh(): Observable<AuthResponse> {

    const refreshToken = this.tokenService.getRefreshToken();

    return this.http.post<AuthResponse>(`${this.api}/refresh`, {
      refreshToken
    });

  }

}