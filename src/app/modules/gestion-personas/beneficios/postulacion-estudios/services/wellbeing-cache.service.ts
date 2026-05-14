import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingCacheService {

  // =========================================
  // 🔥 CACHE
  // =========================================

  private cache =
    new Map<string, any>();

  constructor() {}

  // =========================================
  // 🔥 SET
  // =========================================

  set(
    key: string,
    value: any,
  ): void {

    this.cache.set(
      key,
      value,
    );
  }

  // =========================================
  // 🔥 GET
  // =========================================

  get<T>(
    key: string,
  ): T | null {

    return this.cache.has(key)
      ? this.cache.get(key)
      : null;
  }

  // =========================================
  // 🔥 HAS
  // =========================================

  has(
    key: string,
  ): boolean {

    return this.cache.has(key);
  }

  // =========================================
  // 🔥 REMOVE
  // =========================================

  remove(
    key: string,
  ): void {

    this.cache.delete(key);
  }

  // =========================================
  // 🔥 CLEAR
  // =========================================

  clear(): void {

    this.cache.clear();
  }
}