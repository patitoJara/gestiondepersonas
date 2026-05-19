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

  private apiUrl =
    `${environment.apiUrl}/wellbeing/postulations`;

  constructor() {}

  // =========================================
  // 🔥 DOCUMENT TYPES
  // =========================================

  getDocumentTypes():
    Observable<DocumentTypeResponse[]> {

    return this.http.get<DocumentTypeResponse[]>(
      `${this.apiUrl}/document-types`,
    );
  }

  // =========================================
  // 🔥 GET DOCUMENTS
  // =========================================

  getDocuments(
    postulationId: number,
  ): Observable<DocumentResponse[]> {

    return this.http.get<DocumentResponse[]>(
      `${this.apiUrl}/my/${postulationId}/documents`,
    );
  }

  // =========================================
  // 🔥 DOWNLOAD DOCUMENT
  // =========================================

  downloadDocument(
    postulationId: number,
    documentId: number,
  ): Observable<Blob> {

    return this.http.get(
      `${this.apiUrl}/my/${postulationId}/documents/${documentId}/download`,
      {
        responseType: 'blob',
      },
    );
  }


  // =========================================
  // 🔥 CREATE DOCUMENT METADATA
  // =========================================

  createDocument(
    postulationId: number,
    payload: {
      documentTypeId: number;
      originalFilename: string;
      contentType: string;
      sizeBytes: number;
      storagePath: string;
      checksum: string;
    },
  ): Observable<DocumentResponse> {

    return this.http.post<DocumentResponse>(
      `${this.apiUrl}/my/${postulationId}/documents`,
      payload,
    );
  }

  // =========================================
  // 🔥 DELETE DOCUMENT
  // =========================================

  deleteDocument(
    postulationId: number,
    documentId: number,
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/my/documents/${documentId}`,
    );
  }
}