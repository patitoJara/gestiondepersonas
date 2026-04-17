import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { TypeProperty } from '../models/type-property.model';

@Injectable({
  providedIn: 'root',
})
export class TypePropertyService {
  private apiUrl = `${environment.apiUrl}/types_properties`;

  constructor(private http: HttpClient) {}

  // 🔹 GET TODOS (ACTIVOS)
  getAll(): Observable<TypeProperty[]> {
    return this.http.get<TypeProperty[]>(`${this.apiUrl}`);
  }

  // 🔹 GET TODOS (INCLUYE TODO)
  getAllFull(): Observable<TypeProperty[]> {
    return this.http.get<TypeProperty[]>(`${this.apiUrl}/all`);
  }

  // 🔹 PAGINADO
  getPaginated(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAllPaginated`, { params });
  }

  // 🔹 ELIMINADOS
  getDeleted(): Observable<TypeProperty[]> {
    return this.http.get<TypeProperty[]>(`${this.apiUrl}/deleted`);
  }

  // 🔹 POR ID
  getById(id: number): Observable<TypeProperty> {
    return this.http.get<TypeProperty>(`${this.apiUrl}/${id}`);
  }

  // 🔹 CREAR
  create(data: Partial<TypeProperty>): Observable<TypeProperty> {
    return this.http.post<TypeProperty>(`${this.apiUrl}`, data);
  }

  // 🔹 ACTUALIZAR
  update(id: number, data: Partial<TypeProperty>): Observable<TypeProperty> {
    return this.http.put<TypeProperty>(`${this.apiUrl}/${id}`, data);
  }

  // 🔹 ELIMINAR (SOFT DELETE)
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 🔹 RESTORE
  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }
}