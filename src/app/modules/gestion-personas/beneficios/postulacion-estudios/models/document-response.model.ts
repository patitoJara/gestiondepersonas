export interface DocumentResponse {
  id: number;

  documentTypeId: number;

  documentTypeName: string;

  fileName: string;

  fileSize: number;

  contentType: string;

  uploaded: boolean;
}