import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  UsersGroup,
  CreateUsersGroupDto,
} from '../../models/users-group.model';

@Injectable({
  providedIn: 'root',
})
export class UsersGroupService {
  private baseUrl = `${environment.apiUrl}/users_groups`;

  constructor(private http: HttpClient) {}

  // ============================
  // 📦 CRUD
  // ============================

  getAll(): Observable<UsersGroup[]> {
    return this.http.get<UsersGroup[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<UsersGroup> {
    return this.http.get<UsersGroup>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateUsersGroupDto): Observable<UsersGroup> {
    return this.http.post<UsersGroup>(this.baseUrl, data);
  }

  update(id: number, data: UsersGroup): Observable<UsersGroup> {
    return this.http.put<UsersGroup>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/restore`, {});
  }

  // ============================
  // 🔍 RELACIONES
  // ============================

  getByUser(userId: number): Observable<UsersGroup[]> {
    return this.http.get<UsersGroup[]>(
      `${this.baseUrl}/user/${userId}`
    );
  }

  deleteByUser(userId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/user/${userId}`
    );
  }

  deleteUserRole(userId: number, roleId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/user/${userId}/role/${roleId}`
    );
  }

  // ============================
  // 📊 EXTRA
  // ============================

  getPaginated(page: number, size: number) {
    return this.http.get(
      `${this.baseUrl}/getAllPaginated?page=${page}&size=${size}`
    );
  }

  getDeleted(): Observable<UsersGroup[]> {
    return this.http.get<UsersGroup[]>(`${this.baseUrl}/deleted`);
  }
}