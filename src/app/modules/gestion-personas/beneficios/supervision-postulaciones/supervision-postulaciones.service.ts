import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { PostulationResponse } from '../postulacion-estudios/models/postulation-response.model';

export interface SupervisionDocument {
  id: number;

  originalFilename: string;

  sizeBytes?: number;

  mimeType?: string;

  documentTypeId?: number;

  documentTypeName?: string;

  documentTypeCode?: string;

  storagePath?: string;

  contentType?: string;

  createdAt?: string | null;

  uploadedAt?: string | null;

  [key: string]: any;
}

export interface SupervisionPostulation extends PostulationResponse {
  documents?: SupervisionDocument[];
  uploadedDocuments?: SupervisionDocument[];
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class SupervisionPostulacionesService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/wellbeing/postulations`;

  /**
   * Lista general de postulaciones para supervisión.
   *
   * Endpoint existente:
   * GET /api/v1/wellbeing/postulations
   *
   * La primera versión puede cargar el listado completo y aplicar
   * filtros en frontend. El método igualmente queda preparado para
   * enviar filtros al backend cuando estén disponibles.
   */
  search(
    params: Record<string, string | number | boolean | null | undefined> = {},
  ): Observable<any> {
    let httpParams = new HttpParams();

    // =========================================
    // 🔥 TRAER SUFICIENTES REGISTROS PARA LA PRUEBA
    // =========================================

    httpParams = httpParams.set('page', '0');

    httpParams = httpParams.set('size', '200');

    httpParams = httpParams.set('sort', 'updatedAt,desc');

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<any>(this.apiUrl, {
      params: httpParams,
    });
  }

  /**
   * Obtiene el resumen completo de una postulación.
   *
   * GET /api/v1/wellbeing/postulations/{postulationId}/summary
   */
  getSummary(postulationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${postulationId}/summary`);
  }

  /**
   * Obtiene los documentos asociados a una postulación.
   *
   * GET /api/v1/wellbeing/postulations/{postulationId}/documents
   */
  getDocuments(postulationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${postulationId}/documents`);
  }

  /**
   * Descarga física de un documento.
   *
   * Endpoint existente:
   * GET /api/v1/wellbeing/postulations/documents/{documentId}/download
   */
  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
  }
}
