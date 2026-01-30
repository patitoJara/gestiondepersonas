// ============================================================
// ✅ IntPrevService — Servicio CRUD para Previsiones (Tipo general)
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IntPrev } from '../models/int-prev';

@Injectable({
  providedIn: 'root'
})
export class IntPrevService {

  private readonly resourceUrl = `${environment.apiBaseUrl}/int_prevs`;

  constructor(private http: HttpClient) {}

  // ============================================================
  // 🔹 Obtener todas las previsiones (sin paginar)
  // ============================================================
  getAll(): Observable<IntPrev[]> {
    return this.http.get<IntPrev[]>(`${this.resourceUrl}/all`);
  }

  
  // ============================================================
  // 🔹 Obtener previsiones paginadas con filtros opcionales
  // ============================================================
  getAllPaginated(params: {
    page?: number;
    size?: number;
    q?: string;
    state?: string;
    sort?: string;
  } = {}): Observable<any> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.state) httpParams = httpParams.set('state', params.state);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<any>(`${this.resourceUrl}/getAllPaginated`, { params: httpParams });
  }

  // ============================================================
  // 🔹 Guardar nuevo registro
  // ============================================================
  save(data: IntPrev): Observable<IntPrev> {
    return this.http.post<IntPrev>(`${this.resourceUrl}`, data);
  }

  // ============================================================
  // 🔹 Actualizar registro existente
  // ============================================================
  update(id: number, data: IntPrev): Observable<IntPrev> {
    return this.http.put<IntPrev>(`${this.resourceUrl}/${id}`, data);
  }

  // ============================================================
  // 🔹 Eliminación lógica (Soft Delete)
  // ============================================================
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/softDelete/${id}`);
  }

  // ============================================================
  // 🔹 Restaurar registro eliminado
  // ============================================================
  restore(id: number): Observable<void> {
    return this.http.put<void>(`${this.resourceUrl}/restore/${id}`, {});
  }

  // ============================================================
  // 🔹 Obtener previsión específica por ID
  // ============================================================
  findById(id: number): Observable<IntPrev> {
    return this.http.get<IntPrev>(`${this.resourceUrl}/findById/${id}`);
  }

  // ============================================================
  // 🔹 Obtener previsiones eliminadas
  // ============================================================
  getDeleted(): Observable<IntPrev[]> {
    return this.http.get<IntPrev[]>(`${this.resourceUrl}/deleted`); 
  }
}
