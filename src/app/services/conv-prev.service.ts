// src/app/services/conv-prev.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConvPrev } from '../models/conv-prev';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConvPrevService {
  private http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/conv_prevs`;

  getAllPaginated(page: number, size: number, q: string = '') {
    return this.http.get(`${this.resourceUrl}/getAllPaginated`, {
      params: { page, size, q }
    });
  }

  save(body: Partial<ConvPrev>): Observable<ConvPrev> {
    return this.http.post<ConvPrev>(`${this.resourceUrl}`, body);
  }

  update(id: number, body: Partial<ConvPrev>): Observable<ConvPrev> {
    return this.http.put<ConvPrev>(`${this.resourceUrl}/${id}`, body);
  }

  softDelete(id: number) {
    return this.http.delete(`${this.resourceUrl}/${id}`);
  }

  restore(id: number) {
    return this.http.patch(`${this.resourceUrl}/restore/${id}`, {});
  }

  // 🔹 Obtener todos activos
  getAll(): Observable<ConvPrev[]> {
    return this.http.get<ConvPrev[]>(`${this.resourceUrl}/all`);
  }

}


/*
  // 🔹 Obtener todos (paginado)
 getAllPaginated(page: number = 0, size: number = 10, q: string = ''): Observable<any> {
  return this.http.get(`${this.resourceUrl}/getAllPaginated`, {
    params: { page, size, q },
  });
}


  // 🔹 Obtener por ID
  getById(id: number): Observable<ConvPrev> {
    return this.http.get<ConvPrev>(`${this.resourceUrl}/${id}`);
  }

  // 🔹 Crear
  create(data: Partial<ConvPrev>): Observable<ConvPrev> {
    return this.http.post<ConvPrev>(`${this.resourceUrl}`, data);
  }

  // 🔹 Actualizar
  update(id: number, data: Partial<ConvPrev>): Observable<ConvPrev> {
    return this.http.put<ConvPrev>(`${this.resourceUrl}/${id}`, data);
  }

  // 🔹 Eliminado lógico
  softDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  // 🔹 Restaurar
  restore(id: number): Observable<void> {
    return this.http.post<void>(`${this.resourceUrl}/${id}/restore`, {});
  }

  // 🔹 Obtener eliminados
  getDeleted(): Observable<ConvPrev[]> {
    return this.http.get<ConvPrev[]>(`${this.resourceUrl}/deleted`);
  }

*/