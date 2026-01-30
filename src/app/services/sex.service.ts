// src/app/services/sex.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sex } from '../models/sex';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  // empty?: boolean; // si tu backend lo envía
}

@Injectable({ providedIn: 'root' })

export class SexService {
  private http = inject(HttpClient);

  // Deriva las URLs desde tu BaseUrl (sin barra final)
  private readonly resourceUrl = `${environment.apiBaseUrl}/sexs`;

  /** GET /sexs/{id} */
  findById(id: number): Observable<Sex> {
    return this.http.get<Sex>(`${this.resourceUrl}/${id}`);
  }

  /** PUT /sexs/{id} */

  update(id: number, sex: Sex): Observable<Sex> {
    return this.http.put<Sex>(`${this.resourceUrl}/${id}`, sex);
  }

  /** DELETE /sexs/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  /** GET /sexs */
  listAll(): Observable<Sex[]> {
    return this.http.get<Sex[]>(this.resourceUrl);
  }

  /** POST /sexs */
  save(sex: Sex): Observable<Sex> {
    return this.http.post<Sex>(this.resourceUrl, sex);
  }

  /** POST /sexs/{id}/restore */
  restore(id: number): Observable<Sex> {
    return this.http.post<Sex>(`${this.resourceUrl}/${id}/restore`, {});
  }

  /** GET /sexs/getAllPaginated?page=&size=&q=&state=&sort= */
  getAllPaginated(opts: { page?: number; size?: number; q?: string; state?: string; sort?: string } = {}): Observable<Page<Sex>> {
    const { page = 0, size = 10, q, state, sort } = opts;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (q)     params = params.set('q', q);
    if (state) params = params.set('state', state);
    if (sort)  params = params.set('sort', sort);

    //return this.http.get<Page<Role>>(`${this.resourceUrl}/getAllPaginated`, { params });
    return this.http.get<Page<Sex>>(`${this.resourceUrl}/all`);
  }

  /** DELETE /sexs/all (si tu API lo soporta) */
  deleteAll(): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/all`);
  }
          /*
            GET /api/v1/sexs/{id}
            PUT /api/v1/sexs/{id}
            DELETE /api/v1/sexs/{id}
            GET /api/v1/sexs
            POST /api/v1/sexs
            POST /api/v1/sexs/{id}/restore
            GET /api/v1/sexs/getAllPaginated
            GET /api/v1/sexs/deleted
            GET /api/v1/sexs/all
        */  
}


