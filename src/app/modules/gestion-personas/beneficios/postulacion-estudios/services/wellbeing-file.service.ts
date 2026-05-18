import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingFileService {

  constructor() {}

  // =========================================
  // 🔥 IS IMAGE
  // =========================================

  isImage(
    file?: File | null,
  ): boolean {

    if (!file) {
      return false;
    }

    return file.type.startsWith(
      'image/',
    );
  }

  // =========================================
  // 🔥 IS PDF
  // =========================================

  isPdf(
    file?: File | null,
  ): boolean {

    if (!file) {
      return false;
    }

    return (
      file.type ===
      'application/pdf'
    );
  }

  // =========================================
  // 🔥 FILE SIZE MB
  // =========================================

  sizeMB(
    file?: File | null,
  ): number {

    if (!file) {
      return 0;
    }

    return Number(
      (
        file.size /
        1024 /
        1024
      ).toFixed(2),
    );
  }

  // =========================================
  // 🔥 FORMAT SIZE
  // =========================================

  formatSize(
    bytes?: number | null,
  ): string {

    if (!bytes) {
      return '0 KB';
    }

    const kb =
      bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(
      kb / 1024
    ).toFixed(2)} MB`;
  }

  // =========================================
  // 🔥 FILE ICON
  // =========================================

  icon(
    file?: File | null,
  ): string {

    if (!file) {
      return 'attach_file';
    }

    if (this.isPdf(file)) {
      return 'picture_as_pdf';
    }

    if (this.isImage(file)) {
      return 'image';
    }

    return 'description';
  }
}