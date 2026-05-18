import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface Role {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private api = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.api);
  }

  getRole(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.api}/${id}`);
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.api, role);
  }

  updateRole(id: number, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.api}/${id}`, role);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getAllPaginated(params: { page: number; size: number }) {
    return this.http.get(`${this.api}/getAllPaginated`, {
      params: {
        page: params.page,
        size: params.size,
      },
    });
  }
  restore(id: number) {
    return this.http.post(`${this.api}/${id}/restore`, {});
  }
}
