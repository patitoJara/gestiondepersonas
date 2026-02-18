import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Register } from '../models/register';
import { map } from 'rxjs/operators';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private http = inject(HttpClient);

  private readonly resourceUrl = `${environment.apiBaseUrl}/registers`;

  getAll() {
    return this.http.get<Register[]>(`${this.resourceUrl}`);
  }

  getAllRaw() {
    return this.http.get<Register[]>(`${this.resourceUrl}/all`);
  }

  getDeleted() {
    return this.http.get<Register[]>(`${this.resourceUrl}/deleted`);
  }

  getById(id: number) {
    return this.http.get<Register>(`${this.resourceUrl}/${id}`);
  }

  getAllPaginated(
    opts: {
      page?: number;
      size?: number;
      q?: string;
      state?: string;
      sort?: string;
    } = {}
  ): Observable<Page<Register>> {
    const { page = 0, size = 10, q, state, sort } = opts;

    let params = new HttpParams().set('page', page).set('size', size);

    if (q) params = params.set('q', q);
    if (state) params = params.set('state', state);
    if (sort) params = params.set('sort', sort);

    // EL BACKEND CORRECTO
    return this.http.get<Page<Register>>(`${this.resourceUrl}/all`, { params });
  }

  /** 🔍 Buscar registros por RUT (consulta sofisticada) */
  getAllByRut(rut: string): Observable<Register[]> {
    const params = new HttpParams().set('rut', rut);

    return this.http
      .get<any>(`${this.resourceUrl}/searchByRut`, { params })
      .pipe(map((res) => res.content ?? []));
  }
  /*
  getAllRutPaginated(opts: {
    page?: number;
    size?: number;
    rut: string;
    sort?: string;
  }): Observable<Page<Register>> {
    const { page = 0, size = 10, rut, sort } = opts;

    let params = new HttpParams()
      .set('rut', rut)
      .set('page', page)
      .set('size', size);

    if (sort) params = params.set('sort', sort);

    return this.http.get<Page<Register>>(`${this.resourceUrl}/searchByRut`, {
      params,
    });
  }
*/
  create(data: any) {
    return this.http.post<Register>(`${this.resourceUrl}`, data);
  }

  update(id: number, data: any) {
    return this.http.put<Register>(`${this.resourceUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  restore(id: number) {
    return this.http.post(`${this.resourceUrl}/${id}/restore`, {});
  }
}
