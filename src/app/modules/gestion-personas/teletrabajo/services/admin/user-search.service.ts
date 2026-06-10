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
  /**
   * Cache compartida por prefijo.
   *
   * Ejemplo:
   * "pat" consulta backend una sola vez.
   * Después permite filtrar localmente:
   *
   * patricio
   * patricio jara
   * pat jara
   */
  private prefixCache = new Map<string, any[]>();

  constructor(
    private usersService: UsersService,
  ) {}

  search(
    control$: Observable<any>,
  ): Observable<any[]> {
    return control$.pipe(
      debounceTime(300),

      /**
       * El autocomplete puede emitir:
       * - texto escrito manualmente
       * - objeto seleccionado desde la lista
       */
      map((value: any) => {
        if (typeof value === 'string') {
          return value;
        }

        return value?.fullName ?? '';
      }),

      /**
       * Normalizamos antes de comparar.
       *
       * Así evitamos consultas repetidas por diferencias
       * de mayúsculas, espacios o tildes.
       */
      map((term: string) =>
        this.normalize(term),
      ),

      distinctUntilChanged(),

      switchMap((clean: string) => {
        /**
         * No consultar backend antes de escribir 3 letras.
         */
        if (!clean || clean.length < 3) {
          return of([]);
        }

        const prefix = clean.substring(0, 3);

        /**
         * Si el prefijo ya fue consultado,
         * reutilizar resultados almacenados.
         *
         * Esto permite que varios buscadores trabajen
         * de forma independiente sin interferirse.
         */
        if (this.prefixCache.has(prefix)) {
          const cachedUsers =
            this.prefixCache.get(prefix) || [];

          return of(
            this.filterLocal(
              cachedUsers,
              clean,
            ).slice(0, 50),
          );
        }

        /**
         * Prefijo nuevo:
         * consultar backend una sola vez.
         */
        return this.usersService
          .searchUsers(prefix)
          .pipe(
            catchError((error) => {
              console.error(
                '❌ ERROR BUSCANDO USUARIOS:',
                error,
              );

              return of([]);
            }),

            map((response: any) => {
              const users =
                response?.data ||
                response?.content ||
                response ||
                [];

              const mappedUsers =
                users.map((user: any) => ({
                  id: user.id,

                  fullName:
                    user.full_name ||
                    [
                      user.firstName,
                      user.secondName,
                      user.firstLastName,
                      user.secondLastName,
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .replace(/\s+/g, ' ')
                      .trim(),

                  rut:
                    user.rut || '',

                  /**
                   * Se conserva porque algunos formularios
                   * lo necesitan después de seleccionar
                   * al funcionario.
                   *
                   * No participa en la búsqueda.
                   */
                  email:
                    user.email || '',
                }));

              this.prefixCache.set(
                prefix,
                mappedUsers,
              );

              return this.filterLocal(
                mappedUsers,
                clean,
              ).slice(0, 50);
            }),
          );
      }),
    );
  }

  /**
   * Búsqueda inteligente exclusivamente por nombres
   * y apellidos.
   *
   * Ejemplo:
   *
   * búsqueda:
   * patricio jara
   *
   * encuentra:
   * PATRICIO IVAN JARA GARCES
   *
   * No importa que existan palabras intermedias.
   */
  private filterLocal(
    users: any[],
    term: string,
  ): any[] {
    const words =
      this.normalize(term)
        .split(' ')
        .filter(
          (word) =>
            word.length > 0,
        );

    return users.filter((user: any) => {
      const fullName =
        this.normalize(
          user.fullName,
        );

      return words.every(
        (word) =>
          fullName.includes(word),
      );
    });
  }

  /**
   * Limpia mayúsculas, espacios repetidos y tildes.
   */
  private normalize(
    value: any,
  ): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /\s+/g,
        ' ',
      )
      .trim();
  }

  /**
   * Puede utilizarse después de crear o editar usuarios
   * para evitar mostrar información antigua almacenada.
   */
  clearCache(): void {
    this.prefixCache.clear();
  }
}