import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingExportService {

  constructor() {}

  // =========================================
  // 🔥 EXPORT JSON
  // =========================================

  exportJson(
    data: any,
    fileName: string,
  ): void {

    const blob =
      new Blob(
        [
          JSON.stringify(
            data,
            null,
            2,
          ),
        ],
        {
          type: 'application/json',
        },
      );

    this.downloadBlob(
      blob,
      `${fileName}.json`,
    );
  }

  // =========================================
  // 🔥 EXPORT CSV
  // =========================================

  exportCsv(
    rows: any[],
    fileName: string,
  ): void {

    if (!rows?.length) {
      return;
    }

    const headers =
      Object.keys(rows[0]);

    const csv = [

      headers.join(','),

      ...rows.map((r) =>
        headers
          .map((h) =>
            `"${r[h] ?? ''}"`,
          )
          .join(','),
      ),

    ].join('\n');

    const blob =
      new Blob(
        [csv],
        {
          type: 'text/csv;charset=utf-8;',
        },
      );

    this.downloadBlob(
      blob,
      `${fileName}.csv`,
    );
  }

  // =========================================
  // 🔥 DOWNLOAD BLOB
  // =========================================

  downloadBlob(
    blob: Blob,
    fileName: string,
  ): void {

    const url =
      window.URL.createObjectURL(
        blob,
      );

    const a =
      document.createElement('a');

    a.href = url;

    a.download = fileName;

    a.click();

    window.URL.revokeObjectURL(
      url,
    );
  }
}