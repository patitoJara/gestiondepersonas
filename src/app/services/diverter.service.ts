// src/app/services/senders.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Diverter } from '../models/diverter';


export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    // empty?: boolean; // si tu backend lo envía
}

@Injectable({ providedIn: 'root' })

export class DiverterService {
    private http = inject(HttpClient);

    // Deriva las URLs desde tu BaseUrl (sin barra final)
    private readonly resourceUrl = `${environment.apiBaseUrl}/diverters`;


    /** GET /diverters/{id} */
    findById(id: number): Observable<Diverter> {
        return this.http.get<Diverter>(`${this.resourceUrl}/${id}`);
    }

    /** PUT /diverters/{id} */

    update(id: number, data: Diverter): Observable<Diverter> {
        return this.http.put<Diverter>(`${this.resourceUrl}/${id}`, data);
    }

    /** DELETE /diverters/{id} */
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/${id}`);
    }

    /** GET /diverters */
    listAll(): Observable<Diverter[]> {
        return this.http.get<Diverter[]>(this.resourceUrl);
    }

    /** POST /diverters */
    save(data: Diverter): Observable<Diverter> {
        return this.http.post<Diverter>(this.resourceUrl, data);
    }

    /** POST /diverters/{id}/restore */
    restore(id: number): Observable<Diverter> {
        return this.http.post<Diverter>(`${this.resourceUrl}/${id}/restore`, {});
    }

    /** GET /diverters/getAllPaginated?page=&size=&q=&state=&sort= */
    getAllPaginated(opts: { page?: number; size?: number; q?: string; state?: string; sort?: string } = {}): Observable<Page<Diverter>> {
        const { page = 0, size = 10, q, state, sort } = opts;

        let params = new HttpParams()
            .set('page', page)
            .set('size', size);

        if (q) params = params.set('q', q);
        if (state) params = params.set('state', state);
        if (sort) params = params.set('sort', sort);

        //return this.http.get<Page<Role>>(`${this.resourceUrl}/getAllPaginated`, { params });
        return this.http.get<Page<Diverter>>(`${this.resourceUrl}/all`);
    }

    /** DELETE /diverters/all (si tu API lo soporta) */
    deleteAll(): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/all`);
    }
    /*
      GET /api/v1/diverters/{id}
      PUT /api/v1/diverters/{id}
      DELETE /api/v1/diverters/{id}
      GET /api/v1/diverters
      POST /api/v1/diverters
      POST /api/v1/diverters/{id}/restore
      GET /api/v1/diverters/getAllPaginated
      GET /api/v1/diverters/deleted
      GET /api/v1/diverters/all
  */
}


