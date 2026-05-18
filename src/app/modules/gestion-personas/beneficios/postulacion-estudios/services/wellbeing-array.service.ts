import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingArrayService {

  constructor() {}

  // =========================================
  // 🔥 NEXT ID
  // =========================================

  nextId(
    items: any[],
  ): number {

    if (!items.length) {
      return 1;
    }

    return (
      Math.max(
        ...items.map((i) => i.id || 0),
      ) + 1
    );
  }

  // =========================================
  // 🔥 REMOVE BY ID
  // =========================================

  removeById<T>(
    items: T[],
    id: number,
  ): T[] {

    return items.filter(
      (i: any) => i.id !== id,
    );
  }

  // =========================================
  // 🔥 TOGGLE OPEN
  // =========================================

  toggleOpen(
    items: any[],
    id: number,
  ): any[] {

    return items.map((i) => ({
      ...i,

      open:
        i.id === id
          ? !i.open
          : i.open,
    }));
  }

  // =========================================
  // 🔥 CLOSE ALL
  // =========================================

  closeAll(
    items: any[],
  ): any[] {

    return items.map((i) => ({
      ...i,
      open: false,
    }));
  }

  // =========================================
  // 🔥 OPEN FIRST
  // =========================================

  openFirst(
    items: any[],
  ): any[] {

    return items.map((i, index) => ({
      ...i,
      open: index === 0,
    }));
  }

  // =========================================
  // 🔥 HAS DATA
  // =========================================

  hasData(
    item: any,
    keys: string[],
  ): boolean {

    return keys.some(
      (k) => !!item[k],
    );
  }
}