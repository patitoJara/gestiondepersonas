// src/app/services/program.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Program } from '../models/program';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  // empty?: boolean; // si tu backend lo envía
}

@Injectable({ providedIn: 'root' })

export class ProgramService {
  private http = inject(HttpClient);

  // Deriva las URLs desde tu BaseUrl (sin barra final)
  private readonly resourceUrl = `${environment.apiBaseUrl}/programs`;

  /** GET /programs/{id} */
  findById(id: number): Observable<Program> {
    return this.http.get<Program>(`${this.resourceUrl}/${id}`);
  }

  /** PUT /programs/{id} */

  update(id: number, program: Program): Observable<Program> {
    return this.http.put<Program>(`${this.resourceUrl}/${id}`, program);
  }

  /** DELETE /programs/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  /** GET /programs */
  listAll(): Observable<Program[]> {
    return this.http.get<Program[]>(this.resourceUrl);
  }

  /** POST /programs */
  save(program: Program): Observable<Program> {
    return this.http.post<Program>(this.resourceUrl, program);
  }

  /** POST /programs/{id}/restore */
  restore(id: number): Observable<Program> {
    return this.http.post<Program>(`${this.resourceUrl}/${id}/restore`, {});
  }

  /** GET /programs/getAllPaginated?page=&size=&q=&state=&sort= */
  getAllPaginated(opts: { page?: number; size?: number; q?: string; state?: string; sort?: string } = {}): Observable<Page<Program>> {
    const { page = 0, size = 10, q, state, sort } = opts;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (q)     params = params.set('q', q);
    if (state) params = params.set('state', state);
    if (sort)  params = params.set('sort', sort);

    //return this.http.get<Page<Program>>(`${this.resourceUrl}/getAllPaginated`, { params });
    return this.http.get<Page<Program>>(`${this.resourceUrl}/all`);
  }

  /** DELETE /programs/all (si tu API lo soporta) */
  deleteAll(): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/all`);
  }
          /*
        GET /api/v1/programs/{id}
        PUT /api/v1/programs/{id}
        DELETE /api/v1/programs/{id}
        GET /api/v1/programs
        POST /api/v1/programs
        POST /api/v1/programs/{id}/restore
        GET /api/v1/programs/getAllPaginated
        GET /api/v1/programs/deleted
        GET /api/v1/programs/all
        */  
}
