import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Demand } from '../models/demand';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DemandService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/demands`;

  // ✅ Crear nueva demanda
  createDemand(data: Demand): Observable<Demand> {
    return this.http.post<Demand>(`${this.baseUrl}`, data);
  }

  // ✅ Obtener todas
  getAll(): Observable<Demand[]> {
    return this.http.get<Demand[]>(`${this.baseUrl}`);
  }

  // ✅ Obtener por id
  getById(id: number): Observable<Demand> {
    return this.http.get<Demand>(`${this.baseUrl}/${id}`);
  }

  // ✅ Actualizar
  updateDemand(id: number, data: Partial<Demand>): Observable<Demand> {
    return this.http.put<Demand>(`${this.baseUrl}/${id}`, data);
  }

  // ✅ Eliminar
  deleteDemand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
