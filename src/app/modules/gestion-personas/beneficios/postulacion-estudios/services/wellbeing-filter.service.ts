import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingFilterService {

  constructor() {}

  // =========================================
  // 🔥 SEARCH TEXT
  // =========================================

  search<T>(
    items: T[],
    term: string,
    fields: string[],
  ): T[] {

    if (!term?.trim()) {
      return items;
    }

    const value =
      term.toLowerCase();

    return items.filter(
      (item: any) =>
        fields.some((f) =>
          String(item[f] || '')
            .toLowerCase()
            .includes(value),
        ),
    );
  }

  // =========================================
  // 🔥 FILTER STATUS
  // =========================================

  byStatus<T>(
    items: T[],
    status: string,
  ): T[] {

    if (!status) {
      return items;
    }

    return items.filter(
      (i: any) =>
        i.status === status,
    );
  }

  // =========================================
  // 🔥 FILTER ACTIVE
  // =========================================

  active<T>(
    items: T[],
  ): T[] {

    return items.filter(
      (i: any) =>
        !i.deletedAt,
    );
  }

  // =========================================
  // 🔥 SORT BY DATE DESC
  // =========================================

  sortDateDesc<T>(
    items: T[],
    field: string,
  ): T[] {

    return [...items].sort(
      (a: any, b: any) =>
        new Date(b[field]).getTime() -
        new Date(a[field]).getTime(),
    );
  }

  // =========================================
  // 🔥 SORT BY NAME
  // =========================================

  sortByName<T>(
    items: T[],
    field: string,
  ): T[] {

    return [...items].sort(
      (a: any, b: any) =>
        String(a[field] || '')
          .localeCompare(
            String(b[field] || ''),
            'es',
          ),
    );
  }
}