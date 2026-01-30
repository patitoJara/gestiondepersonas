// src/app/services/program.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role } from '../models/role';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  // empty?: boolean; // si tu backend lo envía
}

@Injectable({ providedIn: 'root' })

export class RoleService {
  private http = inject(HttpClient);

  // Deriva las URLs desde tu BaseUrl (sin barra final)
  private readonly resourceUrl = `${environment.apiBaseUrl}/roles`;

  /** GET /roles/{id} */
  findById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.resourceUrl}/${id}`);
  }

  /** PUT /roles/{id} */

  update(id: number, role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.resourceUrl}/${id}`, role);
  }

  /** DELETE /roles/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  /** GET /roles */
  listAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.resourceUrl);
  }

  /** POST /roles */
  save(role: Role): Observable<Role> {
    return this.http.post<Role>(this.resourceUrl, role);
  }

  /** POST /roles/{id}/restore */
  restore(id: number): Observable<Role> {
    return this.http.post<Role>(`${this.resourceUrl}/${id}/restore`, {});
  }

  /** GET /roles/getAllPaginated?page=&size=&q=&state=&sort= */
  getAllPaginated(opts: { page?: number; size?: number; q?: string; state?: string; sort?: string } = {}): Observable<Page<Role>> {
    const { page = 0, size = 10, q, state, sort } = opts;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (q)     params = params.set('q', q);
    if (state) params = params.set('state', state);
    if (sort)  params = params.set('sort', sort);

    //return this.http.get<Page<Role>>(`${this.resourceUrl}/getAllPaginated`, { params });
    return this.http.get<Page<Role>>(`${this.resourceUrl}/all`);
  }

  /** DELETE /roles/all (si tu API lo soporta) */
  deleteAll(): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/all`);
  }
          /*
            GET /api/v1/roles/{id}
            PUT /api/v1/roles/{id}
            DELETE /api/v1/roles/{id}
            GET /api/v1/roles
            POST /api/v1/roles
            POST /api/v1/roles/{id}/restore
            GET /api/v1/roles/getAllPaginated
            GET /api/v1/roles/deleted
            GET /api/v1/roles/all
        */  
}

