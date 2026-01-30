// src/app/not-relevant/not-relevant.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotRelevant } from '../models/not-relevant';


export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    // empty?: boolean; // si tu backend lo envía
}

@Injectable({ providedIn: 'root' })

export class NotRelevantService {
    private http = inject(HttpClient);

    // Deriva las URLs desde tu BaseUrl (sin barra final)
    private readonly resourceUrl = `${environment.apiBaseUrl}/not_revelants`;


    /** GET /not_relevants/{id} */
    findById(id: number): Observable<NotRelevant> {
        return this.http.get<NotRelevant>(`${this.resourceUrl}/${id}`);
    }

    /** PUT /not_relevants/{id} */

    update(id: number, notrelevant: NotRelevant): Observable<NotRelevant> {
        return this.http.put<NotRelevant>(`${this.resourceUrl}/${id}`, notrelevant);
    }

    /** DELETE /not_relevants/{id} */
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/${id}`);
    }

    /** GET /not_relevants */
    listAll(): Observable<NotRelevant[]> {
        return this.http.get<NotRelevant[]>(this.resourceUrl);
    }

    /** POST /not_relevants */
    save(notrelevant: NotRelevant): Observable<NotRelevant> {
        return this.http.post<NotRelevant>(this.resourceUrl, notrelevant);
    }

    /** POST /not_relevants/{id}/restore */
    restore(id: number): Observable<NotRelevant> {
        return this.http.post<NotRelevant>(`${this.resourceUrl}/${id}/restore`, {});
    }

    /** GET /not_relevants/getAllPaginated?page=&size=&q=&state=&sort= */
    getAllPaginated(opts: { page?: number; size?: number; q?: string; state?: string; sort?: string } = {}): Observable<Page<NotRelevant>> {
        const { page = 0, size = 10, q, state, sort } = opts;

        let params = new HttpParams()
            .set('page', page)
            .set('size', size);

        if (q) params = params.set('q', q);
        if (state) params = params.set('state', state);
        if (sort) params = params.set('sort', sort);

        //return this.http.get<Page<Role>>(`${this.resourceUrl}/getAllPaginated`, { params });
        return this.http.get<Page<NotRelevant>>(`${this.resourceUrl}/all`);
    }

    /** DELETE /not-relevants/all (si tu API lo soporta) */
    deleteAll(): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/all`);
    }
    /*
      GET /api/v1/not_relevants/{id}
      PUT /api/v1/not_relevants/{id}
      DELETE /api/v1/not_relevants/{id}
      GET /api/v1/not_relevants
      POST /api/v1/not_relevants
      POST /api/v1/not_relevants/{id}/restore
      GET /api/v1/not-relevants/getAllPaginated
      GET /api/v1/not-relevants/deleted
      GET /api/v1/not-relevants/all
  */
}


