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
   * Lista general de postulaciones activas para supervisión.
   *
   * GET /api/v1/wellbeing/postulations
   */
  search(
    params: Record<string, string | number | boolean | null | undefined> = {},
  ): Observable<any> {
    let httpParams = new HttpParams();

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
   * Lista exclusivamente las postulaciones eliminadas.
   *
   * GET /api/v1/wellbeing/postulations/deleted
   *
   * Filtros opcionales:
   * - userId
   * - periodYear
   * - status
   */
  searchDeleted(
    params: Record<string, string | number | boolean | null | undefined> = {},
  ): Observable<SupervisionPostulation[]> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<SupervisionPostulation[]>(`${this.apiUrl}/deleted`, {
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
   * GET /api/v1/wellbeing/postulations/documents/{documentId}/download
   */
  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
  }

  /**
   * Cambia administrativamente el estado operativo.
   *
   * PATCH /api/v1/wellbeing/postulations/{postulationId}/status
   *
   * Estados permitidos:
   * - DRAFT
   * - SUBMITTED
   */
  changeStatus(
    postulationId: number,
    status: 'DRAFT' | 'SUBMITTED',
  ): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${postulationId}/status`, {
      status,
    });
  }

  /**
   * Elimina lógicamente una postulación.
   *
   * DELETE /api/v1/wellbeing/postulations/{postulationId}
   *
   * El backend completa deleted_at.
   */
  softDeletePostulation(postulationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postulationId}`);
  }

  /**
   * Recupera una postulación eliminada lógicamente.
   *
   * POST /api/v1/wellbeing/postulations/{postulationId}/restore
   *
   * El backend vuelve a dejar deleted_at = NULL.
   */
  restorePostulation(postulationId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postulationId}/restore`, {});
  }
}
