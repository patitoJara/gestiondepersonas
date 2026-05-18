export interface DocumentTypeResponse {
  id: number;
  code: string;
  name: string;
  documentGroup?: string;
  required: boolean;
  helpText?: string;
  allowedExtensions?: string;
  maxSizeMb?: number;

  // Compatibilidad con versiones anteriores del frontend
  category?: string;
}
