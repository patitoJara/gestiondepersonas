import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingSessionService {

  // =========================================
  // 🔥 STORAGE KEYS
  // =========================================

  private PROFILE_KEY =
    'profile';

  private ROLES_KEY =
    'roles';

  private TOKEN_KEY =
    'token';

  constructor() {}

  // =========================================
  // 🔥 PROFILE
  // =========================================

  getProfile(): any {

    const value =
      sessionStorage.getItem(
        this.PROFILE_KEY,
      );

    return value
      ? JSON.parse(value)
      : null;
  }

  // =========================================
  // 🔥 USER ID
  // =========================================

  getUserId():
    number | null {

    return this.getProfile()?.id || null;
  }

  // =========================================
  // 🔥 FULL NAME
  // =========================================

  getFullName():
    string {

    return (
      this.getProfile()?.fullName ||
      ''
    );
  }

  // =========================================
  // 🔥 EMAIL
  // =========================================

  getEmail():
    string {

    return (
      this.getProfile()?.email ||
      ''
    );
  }

  // =========================================
  // 🔥 ROLES
  // =========================================

  getRoles():
    string[] {

    const value =
      sessionStorage.getItem(
        this.ROLES_KEY,
      );

    return value
      ? JSON.parse(value)
      : [];
  }

  // =========================================
  // 🔥 HAS ROLE
  // =========================================

  hasRole(
    role: string,
  ): boolean {

    return this.getRoles()
      .includes(role);
  }

  // =========================================
  // 🔥 TOKEN
  // =========================================

  getToken():
    string {

    return (
      sessionStorage.getItem(
        this.TOKEN_KEY,
      ) || ''
    );
  }

  // =========================================
  // 🔥 IS LOGGED
  // =========================================

  isLogged(): boolean {

    return !!this.getToken();
  }

  // =========================================
  // 🔥 CLEAR
  // =========================================

  clear(): void {

    sessionStorage.removeItem(
      this.PROFILE_KEY,
    );

    sessionStorage.removeItem(
      this.ROLES_KEY,
    );

    sessionStorage.removeItem(
      this.TOKEN_KEY,
    );
  }
}
