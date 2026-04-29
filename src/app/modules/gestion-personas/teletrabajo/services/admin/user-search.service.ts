import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  catchError,
} from 'rxjs/operators';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class UserSearchService {
  private prefixCache = new Map<string, any[]>();
  private currentPrefix = '';

  constructor(private usersService: UsersService) {}

  search(control$: Observable<any>): Observable<any[]> {
    return control$.pipe(
      debounceTime(300),

      map((value: any) => {
        if (typeof value === 'string') return value;
        return value?.fullName ?? '';
      }),

      distinctUntilChanged(),

      switchMap((term: string) => {
        const clean = term.trim().toLowerCase();

        if (!clean || clean.length < 3) {
          this.currentPrefix = '';
          return of([]);
        }

        const prefix = clean.substring(0, 3);

        // 🔥 NUEVO PREFIJO → BACKEND
        if (prefix !== this.currentPrefix) {
          this.currentPrefix = prefix;

          return this.usersService.searchUsers(prefix).pipe(
            catchError(() => of([])),
            map((resp: any) => {
              const users = resp?.data || resp?.content || resp || [];

              const mapped = users.map((u: any) => ({
                id: u.id,
                fullName:
                  u.full_name ||
                  [
                    u.firstName,
                    u.secondName,
                    u.firstLastName,
                    u.secondLastName,
                  ]
                    .filter(Boolean)
                    .join(' '),
                rut: u.rut,
              }));

              this.prefixCache.set(prefix, mapped);

              return this.filterLocal(mapped, clean).slice(0, 50);
            }),
          );
        }

        // 🔥 MISMO PREFIJO → LOCAL
        const cached = this.prefixCache.get(prefix) || [];
        return of(this.filterLocal(cached, clean).slice(0, 50));
      }),
    );
  }

  private filterLocal(users: any[], term: string) {
    return users.filter((u: any) => {
      const full = `${u.fullName} ${u.rut}`.toLowerCase();
      return full.includes(term);
    });
  }
}