// src/app/services/current-user.service.ts
import { Injectable, inject } from '@angular/core';
import { AuthLoginService, AuthProfile } from './auth.login.service';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private auth = inject(AuthLoginService);

  private profile: AuthProfile | null = null;
  private roles: string[] = [];
  private programs: string[] = [];

  constructor() {
    this.restoreSession();
  }

  /** 🔹 Carga datos desde el AuthLoginService o sessionStorage */
  private restoreSession(): void {
    this.profile = this.auth.getProfile();
    this.roles = this.auth.getRoles();
    this.programs = JSON.parse(sessionStorage.getItem('programs') || '[]');
  }

  /** 🧩 Devuelve el perfil actual */
  getProfile(): AuthProfile | null {
    if (!this.profile) this.restoreSession();
    return this.profile;
  }

  /** 🧩 Devuelve los roles actuales */
  getRoles(): string[] {
    if (this.roles.length === 0) this.restoreSession();
    return this.roles;
  }

  /** 🧩 Devuelve los programas asociados */
  getPrograms(): string[] {
    if (this.programs.length === 0) this.restoreSession();
    return this.programs;
  }

  /** 🔒 Verifica si tiene un rol específico */
  hasRole(role: string): boolean {
    return this.getRoles().includes(role.toUpperCase());
  }

  /** 🔓 Verifica si pertenece a alguno de los roles dados */
  hasAnyRole(roles: string[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  /** 🧹 Limpia el usuario actual */
  clear(): void {
    this.profile = null;
    this.roles = [];
    this.programs = [];
  }

  /** 🔹 Expone un observable para integrarse fácilmente */
  getUser$(): Observable<AuthProfile | null> {
    return of(this.getProfile());
  }
}
