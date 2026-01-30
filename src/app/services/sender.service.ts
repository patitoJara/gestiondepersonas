// src/app/services/senders.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sender } from '../models/sender';


export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    // empty?: boolean; // si tu backend lo envía
}

@Injectable({ providedIn: 'root' })

export class SenderService {
    private http = inject(HttpClient);

    // Deriva las URLs desde tu BaseUrl (sin barra final)
    private readonly resourceUrl = `${environment.apiBaseUrl}/senders`;


    /** GET /senders/{id} */
    findById(id: number): Observable<Sender> {
        return this.http.get<Sender>(`${this.resourceUrl}/${id}`);
    }

    /** PUT /senders/{id} */

    update(id: number, sender: Sender): Observable<Sender> {
        return this.http.put<Sender>(`${this.resourceUrl}/${id}`, sender);
    }

    /** DELETE /senders/{id} */
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/${id}`);
    }

    /** GET /senders */
    listAll(): Observable<Sender[]> {
        return this.http.get<Sender[]>(this.resourceUrl);
    }

    /** POST /senders */
    save(sender: Sender): Observable<Sender> {
        return this.http.post<Sender>(this.resourceUrl, sender);
    }

    /** POST /senders/{id}/restore */
    restore(id: number): Observable<Sender> {
        return this.http.post<Sender>(`${this.resourceUrl}/${id}/restore`, {});
    }

    /** GET /senders/getAllPaginated?page=&size=&q=&state=&sort= */
    getAllPaginated(opts: { page?: number; size?: number; q?: string; state?: string; sort?: string } = {}): Observable<Page<Sender>> {
        const { page = 0, size = 10, q, state, sort } = opts;

        let params = new HttpParams()
            .set('page', page)
            .set('size', size);

        if (q) params = params.set('q', q);
        if (state) params = params.set('state', state);
        if (sort) params = params.set('sort', sort);

        //return this.http.get<Page<Role>>(`${this.resourceUrl}/getAllPaginated`, { params });
        return this.http.get<Page<Sender>>(`${this.resourceUrl}/all`);
    }

    /** DELETE /senders/all (si tu API lo soporta) */
    deleteAll(): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/all`);
    }
    /*
      GET /api/v1/senders/{id}
      PUT /api/v1/senders/{id}
      DELETE /api/v1/senders/{id}
      GET /api/v1/senders
      POST /api/v1/senders
      POST /api/v1/senders/{id}/restore
      GET /api/v1/senders/getAllPaginated
      GET /api/v1/senders/deleted
      GET /api/v1/senders/all
  */
}


