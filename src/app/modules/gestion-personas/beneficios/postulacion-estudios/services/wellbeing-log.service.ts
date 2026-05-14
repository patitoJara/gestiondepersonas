import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingLogService {

  constructor() {}

  // =========================================
  // 🔥 INFO
  // =========================================

  info(
    context: string,
    data?: any,
  ): void {

    console.log(
      `ℹ️ [${context}]`,
      data ?? '',
    );
  }

  // =========================================
  // 🔥 SUCCESS
  // =========================================

  success(
    context: string,
    data?: any,
  ): void {

    console.log(
      `✅ [${context}]`,
      data ?? '',
    );
  }

  // =========================================
  // 🔥 WARNING
  // =========================================

  warning(
    context: string,
    data?: any,
  ): void {

    console.warn(
      `⚠️ [${context}]`,
      data ?? '',
    );
  }

  // =========================================
  // 🔥 ERROR
  // =========================================

  error(
    context: string,
    data?: any,
  ): void {

    console.error(
      `❌ [${context}]`,
      data ?? '',
    );
  }

  // =========================================
  // 🔥 STEP
  // =========================================

  step(
    step: number,
    title?: string,
  ): void {

    console.log(
      `🔥 STEP ${step}: ${title || ''}`,
    );
  }

  // =========================================
  // 🔥 API
  // =========================================

  api(
    method: string,
    url: string,
    payload?: any,
  ): void {

    console.log(
      `🌐 ${method.toUpperCase()} ${url}`,
      payload ?? '',
    );
  }
}