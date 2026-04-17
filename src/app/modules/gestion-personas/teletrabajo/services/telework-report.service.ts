import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { forkJoin, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeleworkReportService {

  private apiUsers = `${environment.apiUrl}/users`;
  private apiRegisters = `${environment.apiUrl}/registers`;
  private apiSubscribes = `${environment.apiUrl}/subscribes`;

  constructor(private http: HttpClient) {}

  // ============================================
  // USUARIOS
  // ============================================

  getUsers() {
    return this.http.get<any[]>(this.apiUsers);
  }

  getUserById(id: number) {
    return this.http.get<any>(`${this.apiUsers}/${id}`);
  }

  // ============================================
  // REGISTROS (MARCAS)
  // ============================================

  getRegisters() {
    return this.http.get<any[]>(`${this.apiRegisters}/all`);
  }

  getRegistersPaginated(page: number, size: number) {
    return this.http.get(
      `${this.apiRegisters}/getAllPaginated?page=${page}&size=${size}`,
    );
  }

  getRegistersByUser(userId: number) {
    return this.http.get<any[]>(`${this.apiRegisters}/user/${userId}`);
  }

  getRegisterById(id: number) {
    return this.http.get(`${this.apiRegisters}/${id}`);
  }

  // ============================================
  // 🔥 NUEVO → REGISTROS POR MÚLTIPLES USUARIOS (JEFATURA)
  // ============================================

  getRegistersByUsers(userIds: number[]) {
    if (!userIds || userIds.length === 0) {
      return of([]); // 👈 limpio y rxjs-friendly
    }

    const requests = userIds.map((id) =>
      this.getRegistersByUser(id)
    );

    return forkJoin(requests).pipe(
      map((results) => results.flat())
    );
  }

  // ============================================
  // 🔥 OPCIONAL PRO → CON FILTRO POR FECHA
  // ============================================

  getRegistersByUsersAndRange(
    userIds: number[],
    dateFrom: string,
    dateTo: string
  ) {
    if (!userIds || userIds.length === 0) {
      return of([]);
    }

    const requests = userIds.map((id) =>
      this.http.get<any[]>(
        `${this.apiRegisters}/user/${id}/range?from=${dateFrom}&to=${dateTo}`
      )
    );

    return forkJoin(requests).pipe(
      map((results) => results.flat())
    );
  }

  // ============================================
  // SUSCRIPCIONES TELETRABAJO
  // ============================================

  getSubscribes() {
    return this.http.get<any[]>(this.apiSubscribes);
  }

  getSubscribeById(id: number) {
    return this.http.get<any>(`${this.apiSubscribes}/${id}`);
  }

  getSubscribesByUser(userId: number) {
    return this.http.get<any[]>(`${this.apiSubscribes}/user/${userId}`);
  }

  // ============================================
  // FILTROS DEL REPORTE
  // ============================================

  getRegistersByDateRange(dateFrom: string, dateTo: string) {
    return this.http.get<any[]>(
      `${this.apiRegisters}/range?from=${dateFrom}&to=${dateTo}`,
    );
  }

  getRegistersByMonthYear(month: number, year: number) {
    return this.http.get<any[]>(
      `${this.apiRegisters}/month?month=${month}&year=${year}`,
    );
  }

  getRegistersByRut(rut: string) {
    return this.http.get<any[]>(
      `${this.apiRegisters}/rut/${rut}`,
    );
  }

}