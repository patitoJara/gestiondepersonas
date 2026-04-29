import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private api = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  changePassword(
    userId: number,
    data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
  ) {
    return this.http.patch(`${this.api}/${userId}/change-password`, data);
  }

  getAllPaginated(page: number, size: number) {
    return this.http.get(
      `${this.api}/getAllPaginated?page=${page}&size=${size}`,
    );
  }

  getById(id: number) {
    return this.http.get(`${this.api}/${id}`);
  }

  createUser(data: any) {
    return this.http.post(this.api, data);
  }

  updateUser(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  restore(id: number) {
    return this.http.post(`${this.api}/${id}/restore`, {});
  }

  getRoles() {
    return this.http.get<any[]>(`${environment.apiUrl}/roles/all`);
  }

  getUserRoles(userId: number) {
    return this.http.get<any[]>(
      `${environment.apiUrl}/users_roles/user/${userId}`,
    );
  }

  resetPassword(userId: number, newPassword: string) {
    return this.http.post(
      `${environment.apiUrl}/users/${userId}/reset-password`,
      {
        newPassword,
        confirmPassword: newPassword,
      },
    );
  }

  searchUsers(term: string, size: number = 1000) {
    const clean = term?.trim();

    if (!clean) {
      return this.http.get<any>(`${this.api}?size=${size}`);
    }

    return this.http.get<any>(
      `${this.api}/search?term=${encodeURIComponent(clean)}&size=${size}`,
    );
  }

  addUserRole(userId: number, roleId: number) {
    return this.http.post(`${environment.apiUrl}/users_roles`, {
      user: { id: userId },
      role: { id: roleId },
    });
  }

  getAllUsersRoles() {
    return this.http.get<any[]>(`${environment.apiUrl}/users_roles/all`);
  }

  updateUserRoles(userId: number, roles: number[]) {
    return this.http.put(
      `${this.api}/users_roles/${userId}`,
      roles.map((id) => ({ roleId: id })),
    );
  }

  deleteUserRole(userId: number, roleId: number) {
    return this.http.delete(
      `${environment.apiUrl}/users_roles/user/${userId}/role/${roleId}`,
    );
  }

  getAll() {
    return this.http.get<any[]>(`${this.api}/all`);
  }

  existeRut(rut: string) {
    return this.http.get<boolean>(`${this.api}/exists-rut/${rut}`);
  }

  // =========================================
  // 🔍 PREVIEW (TEMPORAL)
  // =========================================
  // =========================================
  // 🔍 PREVIEW (SIMULADO)
  // =========================================
  previewNormalization() {
    return this.getAll();
  }

  // =========================================
  // ⚙️ NORMALIZE (DESACTIVADO)
  // =========================================
  normalizeUsers(payload: any) {
    return this.http.post(`${this.api}/normalize`, payload);
  }
}
