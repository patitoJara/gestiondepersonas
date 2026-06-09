import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocumentTypeResponse } from '../models/document-type-response.model';
import { DocumentResponse } from '../models/document-response.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingDocumentsService {
  // =========================================
  // 🔥 INJECTS
  // =========================================

  private http = inject(HttpClient);

  // =========================================
  // 🔥 BASE URL
  // =========================================

  private apiUrl = `${environment.apiUrl}/wellbeing/postulations`;

  constructor() {}

  // =========================================
  // 🔥 DOCUMENT TYPES
  // =========================================

  getDocumentTypes(): Observable<DocumentTypeResponse[]> {
    return this.http.get<DocumentTypeResponse[]>(
      `${this.apiUrl}/document-types`,
    );
  }

  // =========================================
  // 🔥 GET DOCUMENTS
  // =========================================

  getDocuments(postulationId: number): Observable<DocumentResponse[]> {
    return this.http.get<DocumentResponse[]>(
      `${this.apiUrl}/my/${postulationId}/documents`,
    );
  }

  // =========================================
  // 🔥 UPLOAD PHYSICAL DOCUMENT
  // =========================================
  // No agregar Content-Type manualmente.
  // Angular incorpora automáticamente el boundary.
  // =========================================

  uploadDocument(
    postulationId: number,
    documentTypeId: number,
    file: File,
  ): Observable<DocumentResponse> {
    const formData = new FormData();

    formData.append('documentTypeId', String(documentTypeId));
    formData.append('file', file, file.name);

    return this.http.post<DocumentResponse>(
      `${this.apiUrl}/${postulationId}/documents/upload`,
      formData,
    );
  }

  // =========================================
  // 🔥 DOWNLOAD PHYSICAL DOCUMENT
  // =========================================

  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
  }

  // =========================================
  // 🔥 DELETE DOCUMENT
  // =========================================

  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/my/documents/${documentId}`);
  }
}
