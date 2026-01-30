

// src/app/services/profession.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Profession } from '../models/profession';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  // empty?: boolean; // si tu backend lo envía
}

@Injectable({ providedIn: 'root' })

export class ProfessionService {
  private http = inject(HttpClient);

  // Deriva las URLs desde tu BaseUrl (sin barra final)
  private readonly resourceUrl = `${environment.apiBaseUrl}/professions`;

  /** GET /states/{id} */
  findById(id: number): Observable<Profession> {
    return this.http.get<Profession>(`${this.resourceUrl}/${id}`);
  }

  /** PUT /states/{id} */

  update(id: number, profession: Profession): Observable<Profession> {
    return this.http.put<Profession>(`${this.resourceUrl}/${id}`, profession);
  }

  /** DELETE /Profession/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  /** GET /Profession */
  listAll(): Observable<Profession[]> {
    return this.http.get<Profession[]>(this.resourceUrl);
  }

  /** POST /Profession */
  save(profession: Profession): Observable<Profession> {
    return this.http.post<Profession>(this.resourceUrl, profession);
  }

  /** POST /Profession/{id}/restore */
  restore(id: number): Observable<Profession> {
    return this.http.post<Profession>(`${this.resourceUrl}/${id}/restore`, {});
  }

  /** GET /states/getAllPaginated?page=&size=&q=&state=&sort= */
  getAllPaginated(opts: { page?: number; size?: number; q?: string; state?: string; sort?: string } = {}): Observable<Page<Profession>> {
    const { page = 0, size = 10, q, state, sort } = opts;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (q)     params = params.set('q', q);
    if (state) params = params.set('state', state);
    if (sort)  params = params.set('sort', sort);

    //return this.http.get<Page<states>>(`${this.resourceUrl}/getAllPaginated`, { params });
    return this.http.get<Page<Profession>>(`${this.resourceUrl}/all`);
  }

  /** DELETE /sexs/all (si tu API lo soporta) */
  deleteAll(): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/all`);
  }
          /*
            GET /api/v1/professions/{id}
            PUT /api/v1/professions/{id}
            DELETE /api/v1/professions/{id}
            GET /api/v1/professions
            POST /api/v1/professions
            POST /api/v1/professions/{id}/restore
            GET /api/v1/professions/getAllPaginated
            GET /api/v1/professions/deleted
            GET /api/v1/professions/all
        */  
}


