// src/app/services/analytics.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, forkJoin, switchMap, map } from 'rxjs';
import { RegisterSubstanceService } from './register-substance.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private api = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private registerSubstanceService: RegisterSubstanceService
  ) {}

  getAllRegistersWithSubstances(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/registers/all`).pipe(
      switchMap((registers) => {
        const requests = registers.map((reg) =>
          this.registerSubstanceService
            .searchByRegisterId(reg.id)
            .pipe(
              map((subs) => ({
                ...reg,
                registerSubstances: subs, // 🔥 IMPORTANTE: mismo nombre que usas en el component
              }))
            )
        );

        return forkJoin(requests);
      })
    );
  }
}