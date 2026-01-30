import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RegisterSubstance } from '../models/register-substance.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegisterSubstanceService {
  private http = inject(HttpClient);

  private readonly resourceUrl = `${environment.apiBaseUrl}/registers_substances`;

  // ============================================================
  // 🔎 CONSULTAS
  // ============================================================

  /** 🔹 Buscar sustancias por Register */
  searchByRegisterId(registerId: number): Observable<RegisterSubstance[]> {
    const params = new HttpParams().set('registerId', registerId);

    return this.http
      .get<any>(`${this.resourceUrl}/searchByRegisterId`, { params })
      .pipe(map((resp) => (Array.isArray(resp) ? resp : resp?.content ?? [])));
  }

  /** 🔹 Obtener por ID */
  getById(id: number): Observable<RegisterSubstance> {
    return this.http.get<RegisterSubstance>(`${this.resourceUrl}/${id}`);
  }

  /** 🔹 Obtener eliminadas */
  getDeleted(): Observable<RegisterSubstance[]> {
    return this.http.get<RegisterSubstance[]>(`${this.resourceUrl}/deleted`);
  }

  // ============================================================
  // ✏️ MUTACIONES
  // ============================================================

  /** 🔹 Crear */
  create(data: RegisterSubstance): Observable<RegisterSubstance> {
    return this.http.post<RegisterSubstance>(this.resourceUrl, data);
  }

  /** 🔹 Actualizar */
  update(
    id: number,
    data: Partial<RegisterSubstance>
  ): Observable<RegisterSubstance> {
    return this.http.put<RegisterSubstance>(`${this.resourceUrl}/${id}`, data);
  }

  /** 🔹 Eliminar por ID (soft delete) */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  /** 🔹 Restaurar */
  restore(id: number): Observable<void> {
    return this.http.post<void>(`${this.resourceUrl}/${id}/restore`, {});
  }

  /** 🔴 Eliminar TODAS las sustancias de un Register */
  deleteByRegisterId(id: number) {
    return this.http.delete(
      `${this.resourceUrl}/by-register/${id}`,
      { responseType: 'text' } // 🔑 CLAVE
    );
  }
}
