// src/app/core/services/time.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

interface ServerTimeResponse {
  dateTime?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TimeService {
  private serverTime$ = new BehaviorSubject<Date | null>(null);

  constructor(private http: HttpClient) {}

  loadServerTime(): void {
    this.http
      .get<ServerTimeResponse>(`${environment.apiUrl}/time/server`)
      .subscribe({
        next: (res) => {
          if (!res.dateTime) {
            this.serverTime$.next(new Date());
            return;
          }

          const iso = res.dateTime.replace(' ', 'T');
          const date = new Date(iso);

          this.serverTime$.next(date);
        },

        error: (err) => {
          console.error('Error obteniendo hora servidor', err);
        },
      });
  }

  getServerTime(): Date {
    return this.serverTime$.value ?? new Date();
  }

  getServerTime$() {
    return this.serverTime$.asObservable();
  }
}
