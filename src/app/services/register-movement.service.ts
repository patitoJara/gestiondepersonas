// src/app/services/register-movement.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs'; // 👈 AQUÍ
import { environment } from '../../environments/environment';
import { RegisterMovement } from '@app/models/register-movement.model';
import { RegisterMovementCreateDto } from '@app/models/register-movement-create.dto';
import { RegisterMovementStateDto } from '@app/models/register-movement-state.dto';

@Injectable({ providedIn: 'root' })
export class RegisterMovementService {
  private readonly resourceUrl = `${environment.apiBaseUrl}/registers_movements`;

  constructor(private http: HttpClient) {}

  /** 🔹 Buscar por register */
  searchByRegisterId(registerId: number): Observable<RegisterMovement[]> {
    const params = new HttpParams().set('registerId', registerId);

    return this.http
      .get<any>(`${this.resourceUrl}/searchByRegisterId`, { params })
      .pipe(
        map(resp => Array.isArray(resp?.content) ? resp.content : [])
      );
  }

  /** 🔹 Crear movimiento (EVENTO NUEVO) */
  create(dto: RegisterMovementCreateDto): Observable<RegisterMovement> {
    return this.http.post<RegisterMovement>(this.resourceUrl, dto);
  }

  /** 🔹 Actualizar SOLO estado */
  updateState(
    id: number,
    dto: RegisterMovementStateDto
  ): Observable<RegisterMovement> {
    return this.http.put<RegisterMovement>(`${this.resourceUrl}/${id}`, dto);
  }


  /** 🔹 Actualizado Completo */
  update(
    id: number,
    dto: RegisterMovementCreateDto
  ): Observable<RegisterMovement> {
    return this.http.put<RegisterMovement>(
      `${this.resourceUrl}/${id}`,
      dto
    );
  }
  
  
  /** 🔹 Eliminar (soft delete) */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  /** 🔹 Restaurar */
  restore(id: number): Observable<void> {
    return this.http.post<void>(`${this.resourceUrl}/${id}/restore`, {});
  }

  deleteByRegister(registerId: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/register/${registerId}`);
  }
}
