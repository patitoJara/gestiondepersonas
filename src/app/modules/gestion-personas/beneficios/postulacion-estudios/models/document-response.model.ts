export interface DocumentResponse {
  id: number;
  documentTypeId: number;
  documentTypeName: string;
  documentTypeCode?: string;
  originalFilename?: string;
  storagePath?: string;
  contentType: string;
  sizeBytes?: number;
  uploadedAt?: string;

  // Compatibilidad con vistas antiguas
  fileName?: string;
  fileSize?: number;
  uploaded?: boolean;
}
