// src/app/core/services/time.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {
  BehaviorSubject,
  Observable,
  firstValueFrom,
  interval,
  map,
  startWith,
} from 'rxjs';

interface ServerTimeResponse {
  dateTime?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TimeService {
  /**
   * Diferencia entre la hora del servidor y la hora local del computador.
   */
  private serverOffsetMs = 0;

  /**
   * Indica si fue posible sincronizar con el servidor.
   */
  private synchronized$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  /**
   * Consulta la hora del servidor y calcula la diferencia
   * respecto del reloj local del computador.
   */
  async loadServerTime(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<ServerTimeResponse>(`${environment.apiUrl}/time/server`),
      );

      if (!res?.dateTime) {
        console.warn(
          '[time] El servidor no entregó dateTime. Se utilizará la hora local.',
        );

        this.serverOffsetMs = 0;
        this.synchronized$.next(false);
        return;
      }

      const iso = res.dateTime.replace(' ', 'T');
      const serverTimeMs = new Date(iso).getTime();

      if (Number.isNaN(serverTimeMs)) {
        throw new Error(
          `Fecha inválida recibida desde el servidor: ${res.dateTime}`,
        );
      }

      this.serverOffsetMs = serverTimeMs - Date.now();
      this.synchronized$.next(true);

      console.log(
        '[time] 🕒 Hora sincronizada. Diferencia con servidor:',
        this.serverOffsetMs,
        'ms',
      );
    } catch (error) {
      console.error(
        '[time] Error obteniendo hora del servidor. Se utilizará la hora local.',
        error,
      );

      this.serverOffsetMs = 0;
      this.synchronized$.next(false);
    }
  }

  /**
   * Hora actual corregida en milisegundos.
   */
  nowMs(): number {
    return Date.now() + this.serverOffsetMs;
  }

  /**
   * Hora actual corregida según el servidor.
   */
  getServerTime(): Date {
    return new Date(this.nowMs());
  }

  /**
   * Mantiene compatibilidad con los componentes existentes.
   *
   * Emite inmediatamente la hora corregida y luego la actualiza
   * cada segundo.
   */
  getServerTime$(): Observable<Date> {
    return interval(1000).pipe(
      startWith(0),
      map(() => this.getServerTime()),
    );
  }

  /**
   * Permite observar si la sincronización fue exitosa.
   */
  getSynchronized$(): Observable<boolean> {
    return this.synchronized$.asObservable();
  }

  /**
   * Consulta directa del estado de sincronización.
   */
  isSynchronized(): boolean {
    return this.synchronized$.value;
  }
}
