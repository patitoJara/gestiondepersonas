// src/app/services/state.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { State } from '../models/state';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  // empty?: boolean; // si tu backend lo envía
}

@Injectable({ providedIn: 'root' })

export class StateService {
  private http = inject(HttpClient);

  // Deriva las URLs desde tu BaseUrl (sin barra final)
  private readonly resourceUrl = `${environment.apiBaseUrl}/states`;

  /** GET /states/{id} */
  findById(id: number): Observable<State> {
    return this.http.get<State>(`${this.resourceUrl}/${id}`);
  }

  /** PUT /states/{id} */

  update(id: number, state: State): Observable<State> {
    return this.http.put<State>(`${this.resourceUrl}/${id}`, state);
  }

  /** DELETE /states/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  /** GET /states */
  listAll(): Observable<State[]> {
    return this.http.get<State[]>(this.resourceUrl);
  }

  /** POST /states */
  save(state: State): Observable<State> {
    return this.http.post<State>(this.resourceUrl, state);
  }

  /** POST /states/{id}/restore */
  restore(id: number): Observable<State> {
    return this.http.post<State>(`${this.resourceUrl}/${id}/restore`, {});
  }

  /** GET /states/getAllPaginated?page=&size=&q=&state=&sort= */
  getAllPaginated(opts: { page?: number; size?: number; q?: string; state?: string; sort?: string } = {}): Observable<Page<State>> {
    const { page = 0, size = 10, q, state, sort } = opts;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (q)     params = params.set('q', q);
    if (state) params = params.set('state', state);
    if (sort)  params = params.set('sort', sort);

    //return this.http.get<Page<states>>(`${this.resourceUrl}/getAllPaginated`, { params });
    return this.http.get<Page<State>>(`${this.resourceUrl}/all`);
  }

  /** DELETE /sexs/all (si tu API lo soporta) */
  deleteAll(): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/all`);
  }
          /*
        GET /api/v1/states/{id}
        PUT /api/v1/states/{id}
        DELETE /api/v1/states/{id}
        GET /api/v1/states
        POST /api/v1/states
        POST /api/v1/states/{id}/restore
        GET /api/v1/states/getAllPaginated
        GET /api/v1/states/deleted
        GET /api/v1/states/all
        */  
}


