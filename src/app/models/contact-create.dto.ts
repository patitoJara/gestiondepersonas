// src/app/models/contact-create.dto.ts

export interface ContactCreateDto {
  name: string;
  description?: string;
  email?: string;
  cellphone?: string;
  postulant: { id: number };
}