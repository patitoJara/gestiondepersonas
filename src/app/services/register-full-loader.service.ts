// src/app/services/register-full-loader.service.ts

import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { RegisterService } from './register.service';
import { RegisterSubstanceService } from './register-substance.service';
import { RegisterMovementService } from './register-movement.service';

import { RegisterFull } from '@app/models/register-full.model';

@Injectable({
  providedIn: 'root',
})
export class RegisterFullLoaderService {
  constructor(
    private registerService: RegisterService,
    private registerSubstanceService: RegisterSubstanceService,
    private registerMovementService: RegisterMovementService
  ) {}

  load(id: number): Observable<RegisterFull> {
    return this.registerService.getById(id).pipe(
      switchMap((fullReg) => {
        const contactoPrincipal = fullReg.contact ?? null;        
        return forkJoin({
          sustancias: this.registerSubstanceService.searchByRegisterId(
            fullReg.id
          ),
          movimientos: this.registerMovementService.searchByRegisterId(
            fullReg.id
          ),
        }).pipe(
          map(({ sustancias, movimientos }) => ({
            registro: {
              ...fullReg,
              contactoPrincipal,
            },
            sustancias: this.extractContent(sustancias),
            movimientos: this.extractContent(movimientos),
          }))
        );
      })
    );
  }


  /**
   * Permite recibir:
   * 1) Page => { content: [...] }
   * 2) Array => [...]
   * 3) null / undefined => []
   */
  private extractContent(data: any): any[] {
    if (!data) return [];

    // Caso Página del backend
    if (Array.isArray(data.content)) return data.content;

    // Caso Array normal
    if (Array.isArray(data)) return data;

    return [];
  }
}
