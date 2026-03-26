import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { Group, CreateGroupDto } from '../../models/group.model';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private baseUrl = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) {}

  // ============================
  // 📦 CRUD
  // ============================

  getAll(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<Group> {
    return this.http.get<Group>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateGroupDto): Observable<Group> {
    return this.http.post<Group>(this.baseUrl, data);
  }

  update(id: number, data: Group): Observable<Group> {
    return this.http.put<Group>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/restore`, {});
  }

  // ============================
  // 📊 EXTRA
  // ============================

  getPaginated(page: number, size: number) {
    return this.http.get(
      `${this.baseUrl}/getAllPaginated?page=${page}&size=${size}`
    );
  }

  getDeleted(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}/deleted`);
  }
}